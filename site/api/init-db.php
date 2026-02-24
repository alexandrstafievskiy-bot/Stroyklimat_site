<?php
/**
 * Database initialization script
 * Import catalog.json into SQLite database
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';

echo "=== STROYKLIMAT Database Initialization ===\n\n";

try {
    // Ініціалізувати базу даних
    echo "1. Connecting to database...\n";
    $db = Database::getInstance();
    echo "   ✓ Database connected\n\n";
    
    // Завантажити catalog.json
    echo "2. Loading catalog.json...\n";
    $catalogFile = __DIR__ . '/../site_data/catalog.json';
    
    if (!file_exists($catalogFile)) {
        throw new Exception("catalog.json not found at: $catalogFile");
    }
    
    $catalogJson = file_get_contents($catalogFile);
    $products = json_decode($catalogJson, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON in catalog.json");
    }
    
    echo "   ✓ Loaded " . count($products) . " products\n\n";
    
    // Імпортувати товари
    echo "3. Importing products into database...\n";
    $result = $db->bulkImportProducts($products);
    
    if (!$result) {
        throw new Exception("Import failed");
    }
    
    echo "   ✓ Products imported successfully\n\n";
    
    // Оновити категорії
    echo "4. Updating categories...\n";
    $categories = $db->updateCategoryCounts();
    echo "   ✓ Found " . count($categories) . " categories\n\n";
    
    // Показати статистику
    echo "5. Database statistics:\n";
    $stats = $db->getStats();
    echo "   Total products: " . $stats['total'] . "\n";
    echo "   In stock: " . $stats['inStock'] . "\n";
    echo "   Categories: " . $stats['categories'] . "\n";
    echo "   Brands: " . $stats['brands'] . "\n\n";
    
    echo "=== Initialization completed successfully! ===\n";
    echo "\nDatabase location: " . DB_PATH . "\n";
    echo "File size: " . round(filesize(DB_PATH) / 1024, 2) . " KB\n";
    
} catch (Exception $e) {
    echo "\n❌ ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
