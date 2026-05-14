<?php
 
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonOut(['success' => false, 'message' => 'Method not allowed'], 405);
}

$email = trim($_POST['email'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonOut(['success' => false, 'message' => 'Invalid email address.']);
}

try {
    $pdo  = getDB();
    $stmt = $pdo->prepare(
        'INSERT IGNORE INTO newsletter_subscribers (email, subscribed_at) VALUES (?, NOW())'
    );
    $stmt->execute([$email]);

    if ($stmt->rowCount() > 0) {
        jsonOut(['success' => true, 'message' => 'Subscribed successfully!']);
    } else {
        jsonOut(['success' => false, 'message' => 'You are already subscribed.']);
    }
} catch (PDOException $e) {
    error_log('Subscribe error: ' . $e->getMessage());
    jsonOut(['success' => false, 'message' => 'Server error. Please try again.'], 500);
}
