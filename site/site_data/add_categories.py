#!/usr/bin/env python3
"""Add categories and breadcrumbs to catalog.json"""
import json
from pathlib import Path

# Категории на основе ключевых слов
CATEGORIES = {
    "Вентиляція": ["вентиляц", "вентилятор", "повітр", "рекуперат"],
    "Кондиціонування": ["кондиціон", "split", "мульт", "чиллер", "фанкойл"],
    "Димоходи та комплектуючі": ["димохід", "димар", "труб димово"],
    "Повітроводи": ["повітровод", "канал", "фітинг", "решітк"],
    "Автоматика та контроль": ["автоматик", "датчик", "контрол", "термостат"],
    "Проєкти та послуги": ["проєкт", "проект", "монтаж", "обслуговув", "сервіс", "ремонт"],
    "Обігрів": ["обігрів", "опален", "котел", "радіатор", "тепло"],
    "Фільтри та очищення": ["фільтр", "очищ", "карбон"],
    "Інше обладнання": []  # fallback
}

def get_category(title, description=""):
    """Визначити категорію та підкатегорії з title/description"""
    text = (title + " " + description).lower()
    
    # Основна категорія
    main_cat = "Інше обладнання"
    for cat, keywords in CATEGORIES.items():
        if any(kw in text for kw in keywords):
            main_cat = cat
            break
    
    # Підкатегорії (детальні)
    sub_cat = None
    if "кондиціон" in text or "split" in text:
        if "централ" in text or "промислов" in text or "напівпромислов" in text:
            sub_cat = "Промислові кондиціонери"
        elif "канальн" in text:
            sub_cat = "Канальні кондиціонери"
        elif "касетн" in text:
            sub_cat = "Касетні кондиціонери"
        elif "колон" in text:
            sub_cat = "Колонні кондиціонери"
        elif "split" in text:
            sub_cat = "Спліт-системи"
        else:
            sub_cat = "Інші кондиціонери"
    
    elif "вентиляц" in text or "вентилятор" in text:
        if "рекупера" in text:
            sub_cat = "Рекуператори"
        elif "кухон" in text:
            sub_cat = "Кухонна вентиляція"
        elif "витяжк" in text:
            sub_cat = "Витяжки"
        elif "осьов" in text:
            sub_cat = "Осьові вентилятори"
        elif "відцентров" in text or "радіальн" in text:
            sub_cat = "Відцентрові вентилятори"
        else:
            sub_cat = "Інша вентиляція"
    
    elif "димохід" in text or "димова" in text:
        if "сталь" in text or "нержав" in text:
            sub_cat = "Димоходи з нержавійки"
        elif "керамік" in text:
            sub_cat = "Керамічні димоходи"
        elif "трійник" in text or "відвід" in text or "коліно" in text:
            sub_cat = "Фітинги для димоходів"
        else:
            sub_cat = "Інші димоходи"
    
    elif "проєкт" in text or "проект" in text or "монтаж" in text or "послуг" in text:
        if "проєкт" in text or "проект" in text:
            sub_cat = "Проєктування"
        elif "монтаж" in text:
            sub_cat = "Монтажні роботи"
        elif "сервіс" in text or "обслуговув" in text:
            sub_cat = "Сервісне обслуговування"
        else:
            sub_cat = "Інші послуги"
    
    # Breadcrumbs: [main_cat, sub_cat (if exists)]
    breadcrumbs = [main_cat]
    if sub_cat:
        breadcrumbs.append(sub_cat)
    
    return breadcrumbs, main_cat

def main():
    catalog_path = Path(__file__).parent / "catalog.json"
    
    # Load catalog
    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    print(f"📦 Processing {len(catalog)} products...")
    
    # Add categories
    category_count = {}
    for item in catalog:
        title = item.get('title', '')
        desc = item.get('description', '')
        
        breadcrumbs, category = get_category(title, desc)
        
        item['breadcrumbs'] = breadcrumbs
        item['category'] = category
        
        # Count
        category_count[category] = category_count.get(category, 0) + 1
    
    # Save
    with open(catalog_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    print("✅ Categories added!")
    print("\n📊 Category distribution:")
    for cat, count in sorted(category_count.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count} items")

if __name__ == '__main__':
    main()
