import json, re, time, os
import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0"}
TIMEOUT = 60

OUT_JSON = "products_full.json"
OUT_JSONL = "products_full.jsonl"   # удобный формат: 1 товар = 1 строка

def fetch_html(url: str) -> str:
    r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
    r.raise_for_status()
    return r.text

def to_int_price(text: str):
    if not text:
        return None
    t = text.replace("\xa0", " ").replace(" ", "")
    m = re.search(r"(\d+)", t)
    return int(m.group(1)) if m else None

def dedupe_keep_order(arr):
    seen = set()
    out = []
    for x in arr:
        if x and x not in seen:
            seen.add(x)
            out.append(x)
    return out

def normalize_url(u: str):
    if not u:
        return None
    u = u.strip()
    if u.startswith("//"):
        u = "https:" + u
    return u

def parse_product(url: str):
    html = fetch_html(url)
    soup = BeautifulSoup(html, "lxml")

    # TITLE
    h1 = soup.find("h1")
    title = h1.get_text(" ", strip=True) if h1 else url.split("/")[-1]

    # PRICE
    price = None
    price_el = soup.select_one('[data-qaid="product_price"], .product__price, .product-price, .js-product-price')
    if price_el:
        price = to_int_price(price_el.get_text(" ", strip=True))
    if price is None:
        txt = soup.get_text(" ", strip=True)
        m = re.search(r"(\d[\d\s\xa0]{1,})\s*₴", txt)
        if m:
            price = int(m.group(1).replace("\xa0", " ").replace(" ", ""))

    # STOCK
    stock = "in_stock"
    txt_all = soup.get_text(" ", strip=True).lower()
    if ("під замовлення" in txt_all) or ("под заказ" in txt_all):
        stock = "on_order"

    # IMAGES (берём все картинки prom.ua + og:image)
    images = []
    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        images.append(og["content"])

    for img in soup.select("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-original")
        src = normalize_url(src)
        if not src:
            continue
        if ("images.prom.ua" in src) or ("prom.ua" in src):
            images.append(src)

    images = dedupe_keep_order(images)

    # Убираем “логотип компании” если он встречается среди фото
    images = [u for u in images if "tov-bis-7" not in u and "w350_h100" not in u]

    # DESCRIPTION (оставляем как один текст — формат позже улучшим на сайте)
    desc_block = soup.select_one(".product-description, .product__description, [data-qaid='product_description']")
    if desc_block:
        description = desc_block.get_text("\n", strip=True)
    else:
        # fallback: берём разумный кусок текста со страницы
        description = soup.get_text("\n", strip=True)
        description = "\n".join([x for x in description.splitlines() if x.strip()][:200])

    # RELATED (best effort)
    related = []
    for a in soup.select("a[href]"):
        href = a.get("href", "")
        if href.startswith("/p") and href.endswith(".html"):
            related.append("https://stroyklimat.net" + href)
        elif href.startswith("https://stroyklimat.net/p") and href.endswith(".html"):
            related.append(href)
    related = dedupe_keep_order([u for u in related if u != url])[:24]

    pid = re.sub(r"[^a-zA-Z0-9_]", "_", url.split("/")[-1])

    return {
        "id": pid,
        "url": url,
        "title": title,
        "price_uah": price,
        "stock": stock,
        "images": images,
        "description": description,
        "related_urls": related
    }

def load_done_set():
    done = set()
    if os.path.exists(OUT_JSONL):
        with open(OUT_JSONL, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    obj = json.loads(line)
                    done.add(obj.get("url"))
                except:
                    pass
    return done

def main():
    with open("data_product_urls.json", "r", encoding="utf-8") as f:
        urls = json.load(f)

    done = load_done_set()
    total = len(urls)
    print("TOTAL URLS:", total)
    print("ALREADY DONE:", len(done))

    parsed = []
    # если jsonl уже есть — не теряем то что было
    if os.path.exists(OUT_JSONL):
        with open(OUT_JSONL, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    parsed.append(json.loads(line))
                except:
                    pass

    for i, url in enumerate(urls, 1):
        if url in done:
            continue
        try:
            p = parse_product(url)
            parsed.append(p)
            with open(OUT_JSONL, "a", encoding="utf-8") as f:
                f.write(json.dumps(p, ensure_ascii=False) + "\n")
            if i % 25 == 0:
                print(f"Parsed {i}/{total}")
        except Exception as e:
            print("FAILED:", url, e)
        time.sleep(0.12)

    # финальный json
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(parsed, f, ensure_ascii=False)

    print("DONE. Saved:", OUT_JSON, "items:", len(parsed))

if __name__ == "__main__":
    main()

