# STROYKLIMAT Backend API

REST API для управління каталогом товарів STROYKLIMAT.

## 📦 Технології

- **PHP 7.4+** (працює на більшості хостингів)
- **SQLite** (не потребує окремого сервера БД)
- **REST API** (JSON формат)

## 🚀 Встановлення

### Крок 1: Перевірка PHP

```bash
php --version
```

Якщо PHP не встановлено:

**macOS:**
```bash
# Встановити Homebrew (якщо немає)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Встановити PHP
brew install php
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install php php-sqlite3
```

**Windows:**
Завантажте з https://windows.php.net/download/

### Крок 2: Ініціалізація бази даних

```bash
cd /Users/stfvsk/STROYKLIMAT/site
php api/init-db.php
```

Це створить:
- `data/stroyklimat.db` - база даних SQLite
- Імпортує всі товари з `site_data/catalog.json`

### Крок 3: Запуск PHP сервера (для тестування)

```bash
# З папки site/
php -S localhost:8000
```

Або використовуйте Apache/Nginx на продакшені.

## 📡 API Endpoints

### Базовий URL
```
http://localhost:8000/api/catalog.php
```

### 1. Отримати весь каталог
```http
GET /api/catalog.php?action=list
```

**Відповідь:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "total": 150,
    "lastUpdate": 1708790400
  }
}
```

### 2. Отримати один товар
```http
GET /api/catalog.php?action=get&id=p123
```

### 3. Створити товар
```http
POST /api/catalog.php?action=create
Content-Type: application/json

{
  "password": "StroyKKlimat2026",
  "product": {
    "title": "Кондиціонер LG...",
    "price_uah": 15000,
    "category": "Кондиціонери",
    "sku": "LG-AC-001",
    "brand": "LG",
    "stock": "in_stock",
    "description": "...",
    "images": ["url1", "url2"],
    "breadcrumbs": ["cat1", "cat2"],
    "featured": false
  }
}
```

### 4. Оновити товар
```http
PUT /api/catalog.php?action=update
Content-Type: application/json

{
  "password": "StroyKKlimat2026",
  "product": {
    "id": "p123",
    "title": "Оновлена назва",
    ...
  }
}
```

### 5. Видалити товар
```http
DELETE /api/catalog.php?action=delete
Content-Type: application/json

{
  "password": "StroyKKlimat2026",
  "id": "p123"
}
```

### 6. Імпортувати каталог
```http
POST /api/catalog.php?action=import
Content-Type: application/json

{
  "password": "StroyKKlimat2026",
  "products": [...]
}
```

### 7. Отримати категорії
```http
GET /api/catalog.php?action=categories
```

### 8. Статистика
```http
GET /api/catalog.php?action=stats
```

### 9. Час оновлення
```http
GET /api/catalog.php?action=timestamp
```

## 🔒 Безпека

**ВАЖЛИВО для продакшену:**

1. **Змініть пароль** в `api/config.php`:
```php
define('ADMIN_PASSWORD', 'ваш_складний_пароль');
```

2. **Налаштуйте CORS** в `api/config.php`:
```php
define('ALLOW_ORIGIN', 'https://yourdomain.com');
```

3. **Вимкніть помилки** в `api/config.php`:
```php
error_reporting(0);
ini_set('display_errors', '0');
```

4. **HTTPS обов'язково** - використовуйте Let's Encrypt (безкоштовно)

## 📁 Структура файлів

```
api/
  ├── catalog.php      # Основний API endpoint
  ├── config.php       # Налаштування
  ├── database.php     # Клас для роботи з БД
  ├── init-db.php      # Скрипт ініціалізації
  └── .htaccess        # Конфігурація Apache

data/
  ├── stroyklimat.db   # База даних SQLite
  ├── api_errors.log   # Логи помилок
  └── .htaccess        # Захист від прямого доступу
```

## 🧪 Тестування API

```bash
# Запустити PHP сервер
php -S localhost:8080

# В іншому терміналі:
# Отримати каталог
curl http://localhost:8080/api/catalog.php?action=list

# Отримати статистику
curl http://localhost:8080/api/catalog.php?action=stats

# Створити товар
curl -X POST http://localhost:8080/api/catalog.php?action=create \
  -H "Content-Type: application/json" \
  -d '{
    "password": "StroyKKlimat2026",
    "product": {
      "title": "Test Product",
      "price_uah": 1000
    }
  }'
```

## 📤 Деплой на хостинг

### Файли для завантаження:
- Вся папка `api/`
- Вся папка `data/` (або створіть на хостингу)
- Всі HTML/CSS/JS файли

### Налаштування:
1. Переконайтесь що PHP увімкнено
2. Перевірте права доступу до папки `data/` (777 або 755)
3. Запустіть `api/init-db.php` через браузер або SSH
4. Перевірте `api/catalog.php?action=list`

### Рекомендовані хостинги (підтримують PHP + SQLite):
- **Hostinger** (від $2/міс)
- **Kamatera** 
- **Bluehost**
- **DigitalOcean** (VPS)

## 🔧 Налаштування admin.html

Після запуску API, адмін-панель автоматично використовуватиме серверну БД замість IndexedDB.

Перевірте налаштування в `js/admin.js`:
```javascript
const API_URL = '/api/catalog.php';  // або 'https://yourdomain.com/api/catalog.php'
```

## ❓ Питання & проблеми

### "Database connection failed"
- Перевірте права доступу до папки `data/`
- Переконайтесь що SQLite увімкнено в PHP: `php -m | grep sqlite3`

### "CORS error"
- Налаштуйте `ALLOW_ORIGIN` в `api/config.php`
- Перевірте `.htaccess` налаштування

### "Unauthorized"
- Перевірте пароль в запиті
- Перевірте `ADMIN_PASSWORD` в `api/config.php`

## 📊 Міграція даних

Якщо у вас вже є товари в IndexedDB:
1. Експортуйте з админки (кнопка "Експорт JSON")
2. Збережіть як `site_data/catalog.json`
3. Запустіть `php api/init-db.php`

---

**Автор:** STROYKLIMAT Development Team  
**Ліцензія:** Proprietary
