from playwright.sync_api import sync_playwright
import json

def run():
    pl = sync_playwright().start()
    try:
        browser = pl.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:8000/')
        page.evaluate('localStorage.clear()')

        # add from catalog
        page.goto('http://localhost:8000/catalog.html')
        page.wait_for_selector('[data-add]', timeout=7000)
        page.locator('[data-add]').first.click()
        page.wait_for_timeout(300)
        page.locator('[data-fav]').first.click()
        page.wait_for_timeout(300)

        # check favorites
        page.goto('http://localhost:8000/favorites.html')
        page.wait_for_timeout(700)
        fav_cards = page.evaluate("() => document.querySelectorAll('.card, .prod-card, .cards .card, .cards article').length")

        # check cart
        page.goto('http://localhost:8000/cart.html')
        page.wait_for_timeout(700)
        cart_rows = page.evaluate("() => document.querySelectorAll('.cart-row, .cart-item, .cart .row, .cart-list .row').length")

        # save screenshots
        page.screenshot(path='site_preview/favorites_after_fix.png', full_page=True)
        page.screenshot(path='site_preview/cart_after_fix.png', full_page=True)

        out = {'fav_cards': fav_cards, 'cart_rows': cart_rows}
        print(json.dumps(out))

        browser.close()
    finally:
        pl.stop()

if __name__ == '__main__':
    run()
