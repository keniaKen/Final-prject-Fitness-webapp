USE userdb;
DROP TABLE IF EXISTS user_profiles;

CREATE TABLE user_profiles (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255),
    age INT,
    phone VARCHAR(50),
    address TEXT
);
UPDATE user_profiles
SET full_name = 'jonah', age = '24', phone = '000 000 0000', address = 'holly djdj'
WHERE user_id = 4;