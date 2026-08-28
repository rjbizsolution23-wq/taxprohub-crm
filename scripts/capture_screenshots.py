#!/usr/bin/env python3
"""Capture full-page screenshots of every key MyVirtual Tax Pro page for the manuals."""
import asyncio, os, sys
from playwright.async_api import async_playwright

BASE = "http://localhost:8899"
OUT = os.path.join(os.path.dirname(__file__), "..", "docs", "screenshots")

PAGES = [
    ("landing",              "/#/",                          "Marketing landing page"),
    ("dashboard",            "/#/dashboard",                 "Command dashboard"),
    ("contacts",             "/#/contacts",                  "Contacts / CRM"),
    ("pipelines",            "/#/pipelines",                 "Deal pipelines"),
    ("tax-clients",          "/#/tax-clients",               "Tax client roster"),
    ("tax-module",           "/#/tax-module",                "Tax module"),
    ("tax-module-intel",     "/#/tax-module?tab=intelligence", "IRS TY2025 intelligence"),
    ("document-intelligence","/#/documents",                 "Document Intelligence OCR"),
    ("conversations",        "/#/conversations",             "Unified inbox"),
    ("campaigns",            "/#/campaigns",                 "Campaigns + drip library"),
    ("workflows",            "/#/workflows",                 "Automation workflows"),
    ("funnels",              "/#/funnels",                   "Funnel builder"),
    ("ai-assistant",         "/#/ai-assistant",              "AI Assistant / Campaign Architect"),
    ("calendar",             "/#/calendar",                  "Calendar & booking"),
    ("analytics",            "/#/analytics",                 "Analytics"),
    ("video",                "/#/video",                     "Video suite"),
    ("billing",              "/#/billing",                   "Enterprise invoicing"),
    ("help-center",          "/#/help",                      "Help Center"),
    ("admin",                "/#/admin",                     "Agency admin"),
    ("settings",             "/#/settings",                  "Settings"),
]

async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        # First load: dismiss tutorial welcome banner by seeding localStorage
        await page.goto(BASE + "/#/", wait_until="networkidle")
        await page.evaluate("""localStorage.setItem('vtp_tutorial_progress_v1',
            JSON.stringify({currentStep:0, completedSteps:[], dismissed:true}))""")
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        for name, route, label in PAGES:
            await page.goto(BASE + route, wait_until="networkidle")
            await page.wait_for_timeout(1600)
            path = os.path.join(OUT, f"{name}.png")
            await page.screenshot(path=path, full_page=False)
            print(f"  ok  {name:24s} {label}")
        # Tutorial overlay screenshot: clear dismissed, open via launcher
        await page.goto(BASE + "/#/dashboard", wait_until="networkidle")
        await page.evaluate("localStorage.removeItem('vtp_tutorial_progress_v1')")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(OUT, "tutorial-welcome.png"))
        print("  ok  tutorial-welcome")
        # Start the tutorial
        try:
            await page.click("text=Start the Tour", timeout=4000)
        except Exception:
            try:
                await page.click("text=Start", timeout=3000)
            except Exception:
                pass
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(OUT, "tutorial-step.png"))
        print("  ok  tutorial-step")
        await browser.close()
        if errors:
            print("JS ERRORS:", errors[:5], file=sys.stderr)
            sys.exit(1)
        print("All screenshots captured with zero JS errors.")

asyncio.run(main())
