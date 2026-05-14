<?php
require_once 'db.php';

$pdo = getDB();
$id  = isset($_GET['id']) ? (int)$_GET['id'] : 0;

try {
    if ($id > 0) {
         
        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if (!$product) {
            jsonOut(['success' => false, 'message' => 'Product not found.'], 404);
        }
        jsonOut(['success' => true, 'product' => $product]);
    } else {
         
        $rows = $pdo->query('SELECT * FROM products ORDER BY id ASC')->fetchAll();
        jsonOut(['success' => true, 'products' => $rows]);
    }
} catch (PDOException $e) {
    error_log('Product fetch error: ' . $e->getMessage());
    jsonOut(['success' => false, 'message' => 'Server error.'], 500);
}
