CREATE DATABASE myForum;
USE myForum;
ALTER USER 'appuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'app2023';
GRANT ALL PRIVILEGES ON myForum.* TO 'appuser'@'localhost';

CREATE TABLE 'userdetails' (
  'id' int NOT NULL AUTO_INCREMENT,
  'username' varchar(255) NOT NULL,
  'first' varchar(255) NOT NULL,
  'last' varchar(255) NOT NULL,
  'email' varchar(255) NOT NULL,
  'hashedPassword' varchar(255) NOT NULL,
  PRIMARY KEY ('id'),
  UNIQUE KEY 'username' ('username')
);

CREATE TABLE 'threads' (
  'id' int NOT NULL AUTO_INCREMENT,
  'title' varchar(255) NOT NULL,
  'content' text NOT NULL,
  'username' varchar(255) NOT NULL,
  'user_id' int DEFAULT NULL,
  PRIMARY KEY ('id'),
  KEY 'fk_user_id' ('user_id'),
  CONSTRAINT 'fk_user_id' FOREIGN KEY ('user_id') REFERENCES 'userdetails' ('id') ON DELETE CASCADE
)