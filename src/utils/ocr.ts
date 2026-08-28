/**
 * 🔬 RJ BUSINESS SOLUTIONS — SOVEREIGN OCR ENGINE (ZERO-KEY)
 * In-Browser Document Intelligence: Tesseract.js v7 WASM + PDF.js v6 Rasterizer
 *
 * This engine performs FULL optical character recognition entirely client-side.
 * ✅ NO AI API keys required   ✅ NO server round-trips   ✅ IRS Pub 4557 friendly
 *    (taxpayer documents never leave the browser)
 *
 * Pipeline:
 *   1. PDF  → rasterized to high-DPI canvas pages via pdfjs-dist
 *   2. Image → recognized via Tesseract WASM (LSTM neural engine)
 *   3. Words → returned with bounding boxes + confidence for structured parsing
 */

import Tesseract, { createWorker } from 'tesseract.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface OCRWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  line: number;
  page: number;
}

export interface OCRPageResult {
  page: number;
  text: string;
  words: OCRWord[];
  confidence: number;
  widthPx: number;
  heightPx: number;
}

export interface OCRResult {
  fullText: string;
  pages: OCRPageResult[];
  meanConfidence: number;
  engine: string;
  durationMs: number;
  pageCount: number;
}

export type OCRProgressCallback = (stage: string, progressPct: number) => void;

// ─────────────────────────────────────────────────────────────────────────────
// Worker lifecycle (singleton — the WASM model is ~15MB, load it once)
// ─────────────────────────────────────────────────────────────────────────────

let workerPromise: Promise<Tesseract.Worker> | null = null;

async function getWorker(onProgress?: OCRProgressCallback): Promise<Tesseract.Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      onProgress?.('Booting neural OCR core (WASM)…', 5);
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            onProgress?.('Recognizing text…', 30 + Math.round(m.progress * 60));
          }
        },
      });
      // Tuned for tax forms: preserve interword spaces, allow digits/symbols
      await worker.setParameters({
        preserve_interword_spaces: '1',
      });
      return worker;
    })();
  }
  return workerPromise;
}

/** Releases the OCR worker & WASM memory. Call when leaving document modules. */
export async function terminateOCR(): Promise<void> {
  if (workerPromise) {
    const w = await workerPromise;
    await w.terminate();
    workerPromise = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF rasterization (pdfjs-dist, dynamic import keeps main bundle lean)
// ─────────────────────────────────────────────────────────────────────────────

async function rasterizePDF(
  data: ArrayBuffer,
  onProgress?: OCRProgressCallback,
  maxPages = 6,
  scale = 2.2
): Promise<HTMLCanvasElement[]> {
  onProgress?.('Loading PDF rasterizer…', 8);
  const pdfjs = await import('pdfjs-dist');
  // Use the module worker bundled by Vite
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  const canvases: HTMLCanvasElement[] = [];
  const pageCount = Math.min(doc.numPages, maxPages);

  for (let i = 1; i <= pageCount; i++) {
    onProgress?.(`Rasterizing page ${i}/${pageCount}…`, 10 + Math.round((i / pageCount) * 15));
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvas, canvasContext: ctx, viewport } as never).promise;
    canvases.push(canvas);
  }
  await loadingTask.destroy();
  return canvases;
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF text-layer fast path (born-digital PDFs skip OCR entirely — instant)
// ─────────────────────────────────────────────────────────────────────────────

async function extractPDFTextLayer(data: ArrayBuffer): Promise<string> {
  try {
    const pdfjs = await import('pdfjs-dist');
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const loadingTask = pdfjs.getDocument({ data: data.slice(0) });
    const doc = await loadingTask.promise;
    let out = '';
    const pageCount = Math.min(doc.numPages, 10);
    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      // Reconstruct lines using Y positions so label/value pairs stay adjacent
      const items = content.items as Array<{ str: string; transform: number[] }>;
      let lastY: number | null = null;
      for (const item of items) {
        const y = Math.round(item.transform[5]);
        if (lastY !== null && Math.abs(y - lastY) > 4) out += '\n';
        else if (out && !out.endsWith('\n')) out += ' ';
        out += item.str;
        lastY = y;
      }
      out += '\n\n';
    }
    await loadingTask.destroy();
    return out.trim();
  } catch {
    return '';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Recognition core
// ─────────────────────────────────────────────────────────────────────────────

interface TesseractWordLike {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

function collectWords(data: Tesseract.Page, pageNum: number): OCRWord[] {
  const words: OCRWord[] = [];
  const blocks = (data as unknown as { blocks?: Array<{ paragraphs: Array<{ lines: Array<{ words: TesseractWordLike[] }> }> }> }).blocks || [];
  let lineIdx = 0;
  for (const block of blocks) {
    for (const para of block.paragraphs || []) {
      for (const line of para.lines || []) {
        for (const w of line.words || []) {
          words.push({
            text: w.text,
            confidence: w.confidence,
            bbox: w.bbox,
            line: lineIdx,
            page: pageNum,
          });
        }
        lineIdx++;
      }
    }
  }
  return words;
}

async function recognizeCanvas(
  canvas: HTMLCanvasElement,
  pageNum: number,
  onProgress?: OCRProgressCallback
): Promise<OCRPageResult> {
  const worker = await getWorker(onProgress);
  const { data } = await worker.recognize(canvas, {}, { blocks: true });
  return {
    page: pageNum,
    text: data.text,
    words: collectWords(data, pageNum),
    confidence: data.confidence,
    widthPx: canvas.width,
    heightPx: canvas.height,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs the full zero-key OCR pipeline against any tax document file.
 * Supports: PDF (multi-page), PNG, JPG, WEBP, BMP, TIFF-in-canvas.
 */
export async function runOCR(file: File, onProgress?: OCRProgressCallback): Promise<OCRResult> {
  const start = performance.now();
  const isPDF = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  const pages: OCRPageResult[] = [];
  let engine = 'Tesseract v7 LSTM (WASM, on-device)';

  if (isPDF) {
    const buf = await file.arrayBuffer();

    // Fast path: born-digital PDF text layer (no OCR needed = instant + 100% accurate)
    onProgress?.('Probing embedded PDF text layer…', 4);
    const textLayer = await extractPDFTextLayer(buf.slice(0));
    if (textLayer.length > 120) {
      engine = 'PDF.js Native Text Layer (lossless extraction)';
      onProgress?.('Embedded text layer found — lossless extraction', 95);
      pages.push({
        page: 1,
        text: textLayer,
        words: [],
        confidence: 99.9,
        widthPx: 0,
        heightPx: 0,
      });
    } else {
      // Scanned PDF: rasterize + OCR each page
      const canvases = await rasterizePDF(buf, onProgress);
      for (let i = 0; i < canvases.length; i++) {
        onProgress?.(`OCR page ${i + 1}/${canvases.length}…`, 30 + Math.round((i / canvases.length) * 60));
        pages.push(await recognizeCanvas(canvases[i], i + 1, onProgress));
      }
    }
  } else {
    // Raster image path
    onProgress?.('Preparing image…', 10);
    const bitmap = await createImageBitmap(file);
    // Upscale small images for better recognition
    const targetW = Math.max(bitmap.width, 1600);
    const ratio = targetW / bitmap.width;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    pages.push(await recognizeCanvas(canvas, 1, onProgress));
  }

  const fullText = pages.map((p) => p.text).join('\n\n');
  const meanConfidence = pages.reduce((s, p) => s + p.confidence, 0) / Math.max(pages.length, 1);
  onProgress?.('Complete', 100);

  return {
    fullText,
    pages,
    meanConfidence,
    engine,
    durationMs: Math.round(performance.now() - start),
    pageCount: pages.length,
  };
}
