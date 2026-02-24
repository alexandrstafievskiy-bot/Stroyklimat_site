import json, re, time, os
import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0"}
TIMEOUT = 60

SITEMAP_GROUPS = "https://stroyklimat.net/sitemap_groups-0.xml"

OUT_DIR = os.path.expanduser("~/STROYKLIMAT/site/site_data")
os.makedirs(OUT_DIR, exist_ok=True)

def fetch(url: str) -> str:
    r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
    r.raise_for_status()
    return r.text

def parse_xml_locs(xml_text: str):
    soup = BeautifulSoup(xml_text, "xml")
    return [x.get_text(strip=True) for x in soup.find_all("loc")]

def extract_product_urls_from_group(html: str):
    soup = BeautifulSoup(html, "lxml")
    urls = []
    for a in soup.select("a[href]"):
        href = a.get("href", "").strip()
        if href.startswith("/p") and href.endswith(".html"):
            urls.append("https://stroyklimat.net" + href)
        elif href.startswith("https://stroyklimat.net/p") and href.endswith(".html"):
            urls.append(href)
    # uniq keep order
    seen = set()
    out = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out

def get_group_title(html: str):
    soup = BeautifulSoup(html, "lxml")
    h1 = soup.find("h1")
    if h1:
        return h1.get_text(" ", strip=True)
    title = soup.find("title")
    return title.get_text(" ", strip=True) if title else "Категорія"

def crawl_group_products(group_url: str, max_pages: int = 60):
    # Prom страницы часто поддерживают ?page=2
    all_urls = []
    for page in range(1, max_pages + 1):
        url = group_url if page == 1 else f"{group_url}?page={page}"
        try:
            html = fetch(url)
        except Exception:
            break

        page_urls = extract_product_urls_from_group(html)
        if not page_urls:
            break

        before = len(all_urls)
        for u in page_urls:
            if u not in all_urls:
                all_urls.append(u)

        # если на странице ничего нового — прекращаем
        if len(all_urls) == before:
            break

        time.sleep(0.15)

    return all_urls

def slugify(s: str):
    s = s.lower().strip()
    s = re.sub(r"https?://", "", s)
    s = re.sub(r"[^a-z0-9а-яіїєёґ]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s[:80] if s else "cat"

def main():
    # 1) load products
    with open(os.path.expanduser("~/STROYKLIMAT/products_full.json"), "r", encoding="utf-8") as f:
        products = json.load(f)

    by_url = {p["url"]: p for p in products}

    # 2) load group urls
    print("Downloading groups sitemap...")
    groups_xml = fetch(SITEMAP_GROUPS)
    group_urls = [u for u in parse_xml_locs(groups_xml) if "/ua/" not in u]
    group_urls = sorted(set(group_urls))
    print("Groups in sitemap:", len(group_urls))

    categories = []
    url_to_cat_ids = {}

    # 3) crawl each group and match products we already parsed
    for i, g in enumerate(group_urls, 1):
        try:
            html = fetch(g)
            title = get_group_title(html)
            prod_urls = crawl_group_products(g)
            # keep only products we actually have
            prod_ids = []
            for u in prod_urls:
                if u in by_url:
                    prod_ids.append(by_url[u]["id"])

            if len(prod_ids) == 0:
                continue

            cat_id = slugify(g)
            categories.append({
                "id": cat_id,
                "title": title,
                "url": g,
                "count": len(prod_ids),
                "product_ids": prod_ids
            })

            for pid in prod_ids:
                url_to_cat_ids.setdefault(pid, set()).add(cat_id)

            if i % 10 == 0:
                print(f"Processed groups {i}/{len(group_urls)}")
            time.sleep(0.2)
        except Exception as e:
            print("FAILED GROUP:", g, e)

    # 4) attach category ids to products (for filtering)
    catalog = []
    for p in products:
        cat_ids = sorted(list(url_to_cat_ids.get(p["id"], [])))
        catalog.append({
            **p,
            "category_ids": cat_ids
        })

    # 5) index: simple homepage sections
    featured = [p["id"] for p in catalog[:24]]

    index = {
        "store_name": 'STROYKLIMAT (ТОВ "Бис 7")',
        "phone": "+380 (50) 973-59-55",
        "email": "denis_bis@ukr.net",
        "featured_product_ids": featured
    }

    # 6) write files
    with open(os.path.join(OUT_DIR, "catalog.json"), "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False)

    with open(os.path.join(OUT_DIR, "categories.json"), "w", encoding="utf-8") as f:
        json.dump(categories, f, ensure_ascii=False)

    with open(os.path.join(OUT_DIR, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False)

    print("DONE:")
    print("catalog:", len(catalog))
    print("categories:", len(categories))
    print("saved to:", OUT_DIR)

if __name__ == "__main__":
    main()


