import json, os

BASE = os.path.expanduser("~/STROYKLIMAT")
SITE_DATA = os.path.join(BASE, "site", "site_data")
os.makedirs(SITE_DATA, exist_ok=True)

with open(os.path.join(BASE, "products_full.json"), "r", encoding="utf-8") as f:
    products = json.load(f)

# простые категории по первой части title
cats = {}
for p in products:
    title = p["title"]
    key = title.split(" ")[0].lower()
    cats.setdefault(key, []).append(p["id"])

categories = []
for k, ids in cats.items():
    categories.append({
        "id": k,
        "title": k.capitalize(),
        "count": len(ids),
        "product_ids": ids
    })

index = {
    "store_name": 'STROYKLIMAT (ТОВ "Бис 7")',
    "featured_product_ids": [p["id"] for p in products[:24]]
}

with open(os.path.join(SITE_DATA, "catalog.json"), "w", encoding="utf-8") as f:
    json.dump(products, f, ensure_ascii=False)

with open(os.path.join(SITE_DATA, "categories.json"), "w", encoding="utf-8") as f:
    json.dump(categories, f, ensure_ascii=False)

with open(os.path.join(SITE_DATA, "index.json"), "w", encoding="utf-8") as f:
    json.dump(index, f, ensure_ascii=False)

print("DONE FAST")
print("catalog:", len(products))
print("categories:", len(categories))

