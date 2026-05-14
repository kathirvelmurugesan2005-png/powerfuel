<?php

session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonOut(['success' => false, 'message' => 'Method not allowed'], 405);
}


$userId = $_SESSION['user_id'] ?? null;
if (!$userId) {
    jsonOut(['success' => false, 'message' => 'Please log in to place an order.'], 401);
}

$body  = file_get_contents('php://input');
$input = json_decode($body, true);
$items = $input['items'] ?? [];

if (empty($items) || !is_array($items)) {
    jsonOut(['success' => false, 'message' => 'Cart is empty.']);
}

try {
    $pdo = getDB();
    $pdo->beginTransaction();

    $total = 0;
    foreach ($items as $item) {
        $total += (float)($item['price'] ?? 0) * (int)($item['qty'] ?? 1);
    }

    $ordStmt = $pdo->prepare(
        'INSERT INTO orders (user_id, total, status, created_at) VALUES (?, ?, "pending", NOW())'
    );
    $ordStmt->execute([$userId, $total]);
    $orderId = $pdo->lastInsertId();

     
    $itmStmt = $pdo->prepare(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES (:order_id, :product_id, :qty, :price)'
    );

    foreach ($items as $item) {
        $pid = (int)($item['product_id'] ?? 0);
        $qty = (int)($item['qty']        ?? 1);
        $prc = (float)($item['price']    ?? 0);

        if ($pid <= 0 || $qty <= 0) continue;

         
        $prod = $pdo->prepare('SELECT price, stock FROM products WHERE id = ? LIMIT 1');
        $prod->execute([$pid]);
        $row = $prod->fetch();

        if (!$row) { $pdo->rollBack(); jsonOut(['success'=>false,'message'=>"Product #$pid not found."]); }
        if ($row['stock'] < $qty) { $pdo->rollBack(); jsonOut(['success'=>false,'message'=>"Insufficient stock for product #$pid."]); }

        $itmStmt->execute([
            ':order_id'   => $orderId,
            ':product_id' => $pid,
            ':qty'        => $qty,
            ':price'      => $row['price'],    
        ]);

         
        $pdo->prepare('UPDATE products SET stock = stock - ? WHERE id = ?')
            ->execute([$qty, $pid]);
    }

    $pdo->commit();
    jsonOut(['success' => true, 'order_id' => $orderId, 'total' => $total]);

} catch (PDOException $e) {
    $pdo->rollBack();
    error_log('Order error: ' . $e->getMessage());
    jsonOut(['success' => false, 'message' => 'Could not place order. Please try again.'], 500);
}
