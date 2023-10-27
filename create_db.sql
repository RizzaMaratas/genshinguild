CREATE DATABASE myForum;
USE myForum;
ALTER USER 'appuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'app2023';
GRANT ALL PRIVILEGES ON myForum.* TO 'appuser'@'localhost';