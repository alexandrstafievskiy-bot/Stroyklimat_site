import json, re
import requests
from bs4 import BeautifulSoup

SITEMAP = "https://stroyklimat.net/sitemap.xml"

def fetch(url):
    r = requests.get(url, timeout=60, headers={"User-Agent":"Mozilla/5.0"})
    r.raise_for_status()
    return r.text

def parse(xml):
    soup = BeautifulSoup(xml, "xml")
    return [x.get_text(strip=True) for x in soup.find_all("loc")]

def is_product(u):
    return re.search(r"/p\d+.*\.html$", u)

def main():
    print("Downloading sitemap...")
    index = fetch(SITEMAP)
    sitemaps = parse(index)

    products = []

    for sm in sitemaps:
        print("Reading:", sm)
        xml = fetch(sm)
        urls = parse(xml)

        for u in urls:
            if is_product(u) and "/ua/" not in u:
                products.append(u)

    products = sorted(set(products))

    print("TOTAL PRODUCTS:", len(products))

    with open("data_product_urls.json","w",encoding="utf-8") as f:
        json.dump(products,f,ensure_ascii=False,indent=2)

if __name__ == "__main__":
    main()


