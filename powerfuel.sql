CREATE DATABASE IF NOT EXISTS powerfuel
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE powerfuel;

CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)     NOT NULL,
    email         VARCHAR(120)    NOT NULL,
    password_hash VARCHAR(255)    NOT NULL,
    last_login    DATETIME            NULL,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_username (username),
    UNIQUE KEY uq_email    (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
    id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100)     NOT NULL,
    description TEXT                 NULL,
    price       DECIMAL(10,2)    NOT NULL,
    stock       INT UNSIGNED     NOT NULL DEFAULT 0,
    image_path  VARCHAR(255)         NULL,
    category    VARCHAR(50)          NULL,
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
    id         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id    INT UNSIGNED    NOT NULL,
    total      DECIMAL(10,2)   NOT NULL,
    status     ENUM('pending','confirmed','shipped','delivered','cancelled')
               NOT NULL DEFAULT 'pending',
    created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    order_id    INT UNSIGNED    NOT NULL,
    product_id  INT UNSIGNED    NOT NULL,
    quantity    INT UNSIGNED    NOT NULL DEFAULT 1,
    unit_price  DECIMAL(10,2)   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_items_order   FOREIGN KEY (order_id)   REFERENCES orders   (id) ON DELETE CASCADE,
    CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ratings (
    user_id    INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    stars      TINYINT      NOT NULL CHECK (stars BETWEEN 1 AND 5),
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id),
    CONSTRAINT fk_rat_user    FOREIGN KEY (user_id)    REFERENCES users    (id) ON DELETE CASCADE,
    CONSTRAINT fk_rat_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    email         VARCHAR(120)  NOT NULL,
    subscribed_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sub_email (email)
) ENGINE=InnoDB;

INSERT IGNORE INTO users (username, email, password_hash) VALUES
('admin', 'admin@powerfuel.com',
 '$2y$12$K8Hf3hJzT5lKfH2x9AuDQeXb.zQVlFb0cJ1AYLQnWbAJOHCh7xbCO');


INSERT IGNORE INTO products (id, name, description, price, stock, image_path, category) VALUES
(1, 'Whey Protein',
 'Fast-absorbing whey protein isolate. 24g protein per serving. Ideal post-workout.',
 2499.00, 150, 'images/whey_protein.jpeg', 'Protein'),

(2, 'Mass Gainer',
 'High-calorie formula with complex carbs and protein for lean muscle gain.',
 1999.00, 120, 'images/mass_gainer.jpeg', 'Protein'),

(3, 'Creatine',
 'Pure micronised creatine monohydrate for increased strength and explosive power.',
 1499.00, 200, 'images/creatine.jpeg', 'Performance'),

(4, 'Fish Oil',
 'Omega-3 rich fish oil capsules. Supports heart health and reduces inflammation.',
 999.00, 300, 'images/fish_oil.jpeg', 'Vitamins'),

(5, 'Munthiri (Grapes)',
 'Dried seedless grapes – natural carbohydrates for quick energy replenishment.',
 1299.00, 80, 'images/munthiri.jpg', 'Natural Foods'),

(6, 'Badam (Almonds)',
 'Premium raw almonds packed with healthy fats, protein and Vitamin E.',
 1399.00, 90, 'images/badam.jpg', 'Natural Foods'),

(7, 'Oats',
 'Whole rolled oats. High fibre, slow-release carbs – the perfect morning fuel.',
 499.00, 250, 'images/oats.jpg', 'Natural Foods'),

(8, 'Peanut Butter',
 'Natural creamy peanut butter. No added sugar. Great protein and healthy fat source.',
 299.00, 180, 'images/peanut_butter.jpg', 'Natural Foods'),

(9, 'Dates',
 'Medjool dates – nature's candy. Rich in iron, potassium and natural sugars.',
 359.00, 160, 'images/dates.jpg', 'Natural Foods');


CREATE OR REPLACE VIEW vw_product_ratings AS
    SELECT
        p.id,
        p.name,
        p.price,
        p.stock,
        ROUND(AVG(r.stars), 1)  AS avg_rating,
        COUNT(r.stars)           AS total_reviews
    FROM products p
    LEFT JOIN ratings r ON r.product_id = p.id
    GROUP BY p.id;

CREATE OR REPLACE VIEW vw_order_summary AS
    SELECT
        o.id          AS order_id,
        u.username,
        o.total,
        o.status,
        o.created_at,
        COUNT(oi.id)  AS item_count
    FROM orders o
    JOIN users       u  ON u.id = o.user_id
    JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id;

CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders      (user_id);
CREATE INDEX IF NOT EXISTS idx_items_order   ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_items_product ON order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_ratings_prod  ON ratings     (product_id);
