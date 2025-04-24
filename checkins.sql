USE storeDB;

CREATE TABLE checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  checkin_date DATE NOT NULL,
  times_checked_in INT DEFAULT 1,
  UNIQUE KEY unique_user_day (user_id, checkin_date)
);