import re
import sys
import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:8000"
PAGES = [
    "/index.html",
    "/catalog.html",
    "/product.html?id=",
    "/cart.html",
    "/favorites.html",
    "/about.html",
    "/delivery.html",
    "/returns.html",
    "/contacts.html",
]


def pick_any_product_id(catalog):
    for p in (catalog or []):
        if p and isinstance(p, dict) and p.get("id"):
            return p["id"]
    return ""


def sanitize_path(path: str) -> str:
    return re.sub(r"[^\w]+", "_", path)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        errors = []
        page.on("pageerror", lambda e: errors.append({"type": "pageerror", "message": str(e)}))

        def _on_console(msg):
            try:
                if msg.type == "error":
                    errors.append({"type": "console", "message": msg.text})
            except Exception:
                pass

        page.on("console", _on_console)

        catalog_res = await page.request.get(f"{BASE}/site_data/catalog.json")
        if catalog_res.status != 200:
            raise RuntimeError("Cannot load site_data/catalog.json")
        catalog = await catalog_res.json()
        pid = pick_any_product_id(catalog)

        resolved = []
        for p in PAGES:
            if p == "/product.html?id=":
                resolved.append(f"/product.html?id={pid}")
            else:
                resolved.append(p)

        for path in resolved:
            await page.goto(f"{BASE}{path}", wait_until="networkidle")
            await page.wait_for_timeout(250)
            await page.screenshot(path=f"./tests_{sanitize_path(path)}.png", full_page=True)

            add_btn = page.locator('[data-add], button:has-text("В кошик"), button:has-text("Купити")').first
            if await add_btn.count():
                try:
                    await add_btn.click(timeout=2000)
                except Exception:
                    pass
                await page.wait_for_timeout(150)

            fav_btn = page.locator('[data-fav], button:has-text("♡"), button:has-text("♥")').first
            if await fav_btn.count():
                try:
                    await fav_btn.click(timeout=2000)
                except Exception:
                    pass
                await page.wait_for_timeout(150)

        if errors:
            print("\n❌ ERRORS FOUND:")
            for e in errors:
                print("-", e.get("type"), e.get("message"))
            await browser.close()
            sys.exit(1)

        print("\n✅ Smoke sweep OK (no console/page errors). Screenshots saved in current folder.")
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
