<?php
/**
 * Database Manager
 * SQLite database wrapper for STROYKLIMAT
 */

class Database {
    private $db;
    private static $instance = null;
    
    private function __construct() {
        $this->connect();
        $this->initTables();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function connect() {
        try {
            // Створюємо папку data якщо не існує
            $dataDir = dirname(DB_PATH);
            if (!is_dir($dataDir)) {
                mkdir($dataDir, 0755, true);
            }
            
            $this->db = new PDO('sqlite:' . DB_PATH);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Увімкнути foreign keys
            $this->db->exec('PRAGMA foreign_keys = ON');
            
        } catch (PDOException $e) {
            error_log('Database connection failed: ' . $e->getMessage());
            throw new Exception('Database connection failed');
        }
    }
    
    private function initTables() {
        try {
            // Таблиця каталогу товарів
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS products (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    price_uah REAL DEFAULT 0,
                    category TEXT,
                    sku TEXT,
                    brand TEXT,
                    stock TEXT DEFAULT 'in_stock',
                    description TEXT,
                    images TEXT,
                    breadcrumbs TEXT,
                    featured INTEGER DEFAULT 0,
                    created_at INTEGER DEFAULT (strftime('%s', 'now')),
                    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
                )
            ");
            
            // Таблиця категорій
            $this->db->exec("
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    count INTEGER DEFAULT 0,
                    created_at INTEGER DEFAULT (strftime('%s', 'now'))
                )
            ");
            
            // Індекси для швидкого пошуку
            $this->db->exec("CREATE INDEX IF NOT EXISTS idx_category ON products(category)");
            $this->db->exec("CREATE INDEX IF NOT EXISTS idx_featured ON products(featured)");
            $this->db->exec("CREATE INDEX IF NOT EXISTS idx_brand ON products(brand)");
            
        } catch (PDOException $e) {
            error_log('Table initialization failed: ' . $e->getMessage());
            throw new Exception('Database initialization failed');
        }
    }
    
    // === PRODUCTS ===
    
    public function getAllProducts() {
        $stmt = $this->db->query("SELECT * FROM products ORDER BY updated_at DESC");
        $products = $stmt->fetchAll();
        
        // Декодуємо JSON поля
        foreach ($products as &$product) {
            $product['images'] = json_decode($product['images'] ?? '[]', true) ?: [];
            $product['breadcrumbs'] = json_decode($product['breadcrumbs'] ?? '[]', true) ?: [];
            $product['featured'] = (bool)$product['featured'];
            $product['price_uah'] = (float)$product['price_uah'];
        }
        
        return $products;
    }
    
    public function getProductById($id) {
        $stmt = $this->db->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        
        if ($product) {
            $product['images'] = json_decode($product['images'] ?? '[]', true) ?: [];
            $product['breadcrumbs'] = json_decode($product['breadcrumbs'] ?? '[]', true) ?: [];
            $product['featured'] = (bool)$product['featured'];
            $product['price_uah'] = (float)$product['price_uah'];
        }
        
        return $product ?: null;
    }
    
    public function createProduct($data) {
        $stmt = $this->db->prepare("
            INSERT INTO products (
                id, title, price_uah, category, sku, brand, stock, 
                description, images, breadcrumbs, featured
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $id = $data['id'] ?? 'p' . time() . rand(1000, 9999);
        
        $result = $stmt->execute([
            $id,
            $data['title'],
            $data['price_uah'] ?? 0,
            $data['category'] ?? '',
            $data['sku'] ?? '',
            $data['brand'] ?? '',
            $data['stock'] ?? 'in_stock',
            $data['description'] ?? '',
            json_encode($data['images'] ?? [], JSON_UNESCAPED_UNICODE),
            json_encode($data['breadcrumbs'] ?? [], JSON_UNESCAPED_UNICODE),
            $data['featured'] ?? false ? 1 : 0
        ]);
        
        return $result ? $id : false;
    }
    
    public function updateProduct($id, $data) {
        $stmt = $this->db->prepare("
            UPDATE products SET
                title = ?,
                price_uah = ?,
                category = ?,
                sku = ?,
                brand = ?,
                stock = ?,
                description = ?,
                images = ?,
                breadcrumbs = ?,
                featured = ?,
                updated_at = strftime('%s', 'now')
            WHERE id = ?
        ");
        
        return $stmt->execute([
            $data['title'],
            $data['price_uah'] ?? 0,
            $data['category'] ?? '',
            $data['sku'] ?? '',
            $data['brand'] ?? '',
            $data['stock'] ?? 'in_stock',
            $data['description'] ?? '',
            json_encode($data['images'] ?? [], JSON_UNESCAPED_UNICODE),
            json_encode($data['breadcrumbs'] ?? [], JSON_UNESCAPED_UNICODE),
            $data['featured'] ?? false ? 1 : 0,
            $id
        ]);
    }
    
    public function deleteProduct($id) {
        $stmt = $this->db->prepare("DELETE FROM products WHERE id = ?");
        return $stmt->execute([$id]);
    }
    
    public function bulkImportProducts($products) {
        $this->db->beginTransaction();
        
        try {
            // Очистити таблицю
            $this->db->exec("DELETE FROM products");
            
            // Вставити нові товари
            $stmt = $this->db->prepare("
                INSERT INTO products (
                    id, title, price_uah, category, sku, brand, stock,
                    description, images, breadcrumbs, featured
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            foreach ($products as $product) {
                $stmt->execute([
                    $product['id'] ?? 'p' . time() . rand(1000, 9999),
                    $product['title'],
                    $product['price_uah'] ?? 0,
                    $product['category'] ?? '',
                    $product['sku'] ?? '',
                    $product['brand'] ?? '',
                    $product['stock'] ?? 'in_stock',
                    $product['description'] ?? '',
                    json_encode($product['images'] ?? [], JSON_UNESCAPED_UNICODE),
                    json_encode($product['breadcrumbs'] ?? [], JSON_UNESCAPED_UNICODE),
                    $product['featured'] ?? false ? 1 : 0
                ]);
            }
            
            $this->db->commit();
            return true;
            
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log('Bulk import failed: ' . $e->getMessage());
            return false;
        }
    }
    
    // === CATEGORIES ===
    
    public function updateCategoryCounts() {
        $stmt = $this->db->query("
            SELECT category, COUNT(*) as count 
            FROM products 
            WHERE category != '' 
            GROUP BY category
        ");
        
        $categories = $stmt->fetchAll();
        
        // Очистити і оновити
        $this->db->exec("DELETE FROM categories");
        
        $insertStmt = $this->db->prepare("INSERT INTO categories (name, count) VALUES (?, ?)");
        foreach ($categories as $cat) {
            $insertStmt->execute([$cat['category'], $cat['count']]);
        }
        
        return $categories;
    }
    
    public function getCategories() {
        $this->updateCategoryCounts();
        $stmt = $this->db->query("SELECT * FROM categories ORDER BY name");
        return $stmt->fetchAll();
    }
    
    // === STATS ===
    
    public function getStats() {
        $stats = [];
        
        // Загальна кількість
        $stmt = $this->db->query("SELECT COUNT(*) as total FROM products");
        $stats['total'] = $stmt->fetch()['total'];
        
        // В наявності
        $stmt = $this->db->query("SELECT COUNT(*) as count FROM products WHERE stock = 'in_stock'");
        $stats['inStock'] = $stmt->fetch()['count'];
        
        // Категорії
        $stmt = $this->db->query("SELECT COUNT(DISTINCT category) as count FROM products");
        $stats['categories'] = $stmt->fetch()['count'];
        
        // Бренди
        $stmt = $this->db->query("SELECT COUNT(DISTINCT brand) as count FROM products WHERE brand != ''");
        $stats['brands'] = $stmt->fetch()['count'];
        
        return $stats;
    }
    
    // === UTILITY ===
    
    public function getLastUpdateTime() {
        $stmt = $this->db->query("SELECT MAX(updated_at) as last_update FROM products");
        $result = $stmt->fetch();
        return $result['last_update'] ?? time();
    }
}
