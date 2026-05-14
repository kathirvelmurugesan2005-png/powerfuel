<?php
 
session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonOut(['success' => false, 'message' => 'Method not allowed'], 405);
}

$userId    = $_SESSION['user_id'] ?? null;
$productId = (int)($_POST['product_id'] ?? 0);
$stars     = (int)($_POST['stars']      ?? 0);

if (!$userId) {
    jsonOut(['success' => false, 'message' => 'Login required to rate products.'], 401);
}
if ($productId <= 0 || $stars < 1 || $stars > 5) {
    jsonOut(['success' => false, 'message' => 'Invalid rating data.']);
}

try {
    $pdo = getDB();
     
    $stmt = $pdo->prepare(
        'INSERT INTO ratings (user_id, product_id, stars, created_at)
         VALUES (:uid, :pid, :stars, NOW())
         ON DUPLICATE KEY UPDATE stars = :stars, created_at = NOW()'
    );
    $stmt->execute([':uid' => $userId, ':pid' => $productId, ':stars' => $stars]);

     
    $avg = $pdo->prepare(
        'SELECT ROUND(AVG(stars),1) AS avg_stars FROM ratings WHERE product_id = ?'
    );
    $avg->execute([$productId]);
    $row = $avg->fetch();

    jsonOut(['success' => true, 'avg_stars' => $row['avg_stars']]);
} catch (PDOException $e) {
    error_log('Rating error: ' . $e->getMessage());
    jsonOut(['success' => false, 'message' => 'Server error.'], 500);
}
