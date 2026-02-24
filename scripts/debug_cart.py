from playwright.sync_api import sync_playwright
import json

import traceback

pl = sync_playwright().start()
try:
    try:
        browser = pl.chromium.launch()
        page = browser.new_page()

        page.goto('http://localhost:8000/')
        page.evaluate("localStorage.clear()")

        # add one item from catalog
        page.goto('http://localhost:8000/catalog.html')
        page.wait_for_selector('[data-add]', timeout=7000)
        try:
            page.locator('[data-add]').first.click()
            page.wait_for_timeout(300)
        except Exception as e:
            print('ADD_ERROR', e)

        cart = page.evaluate("() => localStorage.getItem('cart')")

        # now open cart page and inspect Store/catalog/getById
        page.goto('http://localhost:8000/cart.html')
        page.wait_for_timeout(800)

        catalog_len = page.evaluate("() => (window.Store && window.Store.catalog) ? window.Store.catalog.length : null")
        first_id = page.evaluate("() => { const c = JSON.parse(localStorage.getItem('cart')||'[]'); return c[0] ? c[0].id : null }")
        has_getById = page.evaluate("() => (window.Store && typeof window.Store.getById === 'function')")
        get_by_id = None
        if first_id:
            try:
                get_by_id = page.evaluate("id => window.Store.getById(id)", first_id)
            except Exception as e:
                get_by_id = {'error': str(e)}

        out = {
            'cart_storage': cart,
            'catalog_len': catalog_len,
            'first_id': first_id,
            'has_getById': has_getById,
            'get_by_id': get_by_id,
        }
        print(json.dumps(out, ensure_ascii=False))
        browser.close()
    except Exception:
        traceback.print_exc()
finally:
    try:
        pl.stop()
    except Exception:
        pass
