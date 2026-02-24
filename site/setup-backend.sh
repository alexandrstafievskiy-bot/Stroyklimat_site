#!/bin/bash

# STROYKLIMAT Backend Setup Script
# Автоматична установка та налаштування

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║     STROYKLIMAT Backend - Інсталяція та налаштування      ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Перевірка PHP
echo "🔍 Перевірка PHP..."
if command -v php &> /dev/null; then
    PHP_VERSION=$(php -v | head -n 1)
    echo "✅ PHP встановлено: $PHP_VERSION"
else
    echo "❌ PHP не знайдено"
    echo ""
    echo "Інструкції для встановлення:"
    echo ""
    echo "macOS (через Homebrew):"
    echo "  brew install php"
    echo ""
    echo "Ubuntu/Debian:"
    echo "  sudo apt update && sudo apt install php php-sqlite3"
    echo ""
    exit 1
fi

# Перевірка SQLite
echo ""
echo "🔍 Перевірка SQLite в PHP..."
if php -m | grep -q sqlite3; then
    echo "✅ SQLite3 підтримка увімкнена"
else
    echo "❌ SQLite3 не знайдено в PHP"
    echo "Встановіть: php-sqlite3"
    exit 1
fi

# Створення папки data
echo ""
echo "📁 Створення папки для бази даних..."
mkdir -p data
chmod 755 data
echo "✅ Папка data готова"

# Ініціалізація бази даних
echo ""
echo "🗄️  Ініціалізація бази даних..."
php api/init-db.php

if [ $? -eq 0 ]; then
    echo "✅ База даних створена успішно"
else
    echo "❌ Помилка створення бази даних"
    exit 1
fi

# Перевірка файлів
echo ""
echo "📋 Перевірка файлів..."
FILES=(
    "api/catalog.php"
    "api/config.php"
    "api/database.php"
    "data/stroyklimat.db"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file - ВІДСУТНІЙ!"
    fi
done

# Інструкції для запуску
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Встановлення завершено!                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📡 Запуск сервера:"
echo ""
echo "   Варіант 1 (PHP вбудований сервер):"
echo "   php -S localhost:8000"
echo ""
echo "   Варіант 2 (Python HTTP сервер + PHP):"
echo "   Потрібен Apache або Nginx з PHP"
echo ""
echo "🧪 Тест API:"
echo "   curl http://localhost:8000/api/catalog.php?action=stats"
echo ""
echo "🔐 Адмін-панель:"
echo "   http://localhost:8000/admin.html"
echo ""
echo "⚠️  ВАЖЛИВО для продакшену:"
echo "   - Змініть пароль в api/config.php"
echo "   - Налаштуйте CORS для вашого домену"
echo "   - Увімкніть HTTPS"
echo ""
