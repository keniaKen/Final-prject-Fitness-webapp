USE storeDB;

CREATE TABLE IF NOT EXISTS guests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  age INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO guests (user_id, name, phone, age, created_at)
VALUES (1, 'John Doe', '555-1234', 30, NOW());
SELECT g.name, g.phone, g.age, DATE_FORMAT(g.created_at, '%Y-%m-%d %H:%i:%s') AS registered_on
FROM guests g
JOIN users u ON g.user_id = u.id
WHERE u.id = 1;