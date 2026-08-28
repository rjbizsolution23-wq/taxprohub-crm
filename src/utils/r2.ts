/**
 * ☁️ RJ BUSINESS SOLUTIONS — CLOUDFLARE R2 SECURE VAULT
 * Client-Side Cloudflare R2 Bucket Upload & Storage Manager
 * 
 * Manages document uploads with live telemetry logging and bucket verification.
 */

import { getAppConfig } from './config';

export interface R2UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  latencyMs: number;
  headersSent?: Record<string, string>;
}

/**
 * Uploads a file to the Cloudflare R2 document vault bucket.
 * 
 * @param file The file object to upload
 * @param progressCallback Optional function to track upload progress (0-100)
 */
export async function uploadToCloudflareR2(
  file: File,
  progressCallback?: (pct: number) => void
): Promise<R2UploadResult> {
  const startTime = performance.now();
  const config = getAppConfig();

  const accountId = config.cloudflareAccountId;
  const token = config.cloudflareR2Token;
  const bucketName = 'myvirtual-tax-documents-vault';
  const customS3Url = config.cloudflareR2S3Api;

  // Safe client-side fallback if credentials are unset
  if (!accountId || !token) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      success: false,
      error: 'Missing Cloudflare Account ID or R2 Security Token in Settings.',
      latencyMs: elapsed
    };
  }

  try {
    // Generate a unique safe filename
    const fileExtension = file.name.split('.').pop() || '';
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
    
    // Construct direct R2 public endpoint or S3 Gateway url
    const r2Endpoint = customS3Url 
      ? `${customS3Url}/${bucketName}/${safeName}`
      : `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${safeName}`;

    // Cloudflare direct API or R2 S3 authorization headers
    const headers: Record<string, string> = {
      'Content-Type': file.type || 'application/octet-stream',
      'Authorization': `Bearer ${token}`,
      'X-Amz-Content-SHA256': 'UNSIGNED-PAYLOAD'
    };

    // Client-side XHR to support upload progress monitoring
    const xhrUpload = (): Promise<string> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', r2Endpoint, true);

        Object.entries(headers).forEach(([k, v]) => {
          xhr.setRequestHeader(k, v);
        });

        if (xhr.upload && progressCallback) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              progressCallback(percentComplete);
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(r2Endpoint);
          } else {
            reject(new Error(`Cloudflare Gateway Rejection (${xhr.status}): ${xhr.responseText}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error connecting to Cloudflare R2 Storage. Check CORS configuration.'));
        };

        xhr.send(file);
      });
    };

    const uploadedUrl = await xhrUpload();
    const elapsed = Math.round(performance.now() - startTime);

    return {
      success: true,
      url: uploadedUrl,
      latencyMs: elapsed,
      headersSent: headers
    };
  } catch (error: any) {
    console.warn('R2 live upload failed, returning diagnostic details:', error);
    const elapsed = Math.round(performance.now() - startTime);
    return {
      success: false,
      error: error.message || String(error),
      latencyMs: elapsed
    };
  }
}
