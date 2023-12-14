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

CREATE TABLE Characters (
    character_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    quality VARCHAR(50),
    element VARCHAR(50),
    weapon VARCHAR(50),
    region VARCHAR(50)
);

INSERT INTO Characters (name, quality, element, weapon, region)
VALUES
    ('Amber', '4 Star', 'Pyro', 'Bow', 'Mondstadt'),
    ('Barbara', '4 Star', 'Hydro', 'Catalyst', 'Mondstadt'),
    ('Beidou', '4 Star', 'Electro', 'Claymore', 'Liyue'),
    ('Bennett', '4 Star', 'Pyro', 'Sword', 'Mondstadt'),
    ('Chongyun', '4 Star', 'Cryo', 'Claymore', 'Liyue'),
    ('Diluc', '5 Star', 'Pyro', 'Claymore', 'Mondstadt'),
    ('Fischl', '4 Star', 'Electro', 'Bow', 'Mondstadt'),
    ('Jean', '5 Star', 'Anemo', 'Sword', 'Mondstadt'),
    ('Kaeya', '4 Sstar', 'Cryo', 'Sword', 'Mondstadt'),
    ('Keqing', '5 Star', 'Electro', 'Sword', 'Liyue'),
    ('Klee', '5 Star', 'Pyro', 'Catalyst', 'Mondstadt'),
    ('Lisa', '4 Star', 'Electro', 'Catalyst', 'Mondstadt'),
    ('Mona', '5 Star', 'Hydro', 'Catalyst', 'Mondstadt'),
    ('Ningguang', '4 Star', 'Geo', 'Catalyst', 'Liyue'),
    ('Noelle', '4 Star', 'Geo', 'Claymore', 'Mondstadt'),
    ('Qiqi', '5 Star', 'Cryo', 'Sword', 'Liyue'),
    ('Razor', '4 Star', 'Electro', 'Claymore', 'Mondstadt'),
    ('Sucrose', '4 Star', 'Anemo', 'Catalyst', 'Mondstadt'),
    ('Traveler', '5 Star', 'None', 'Sword', 'None');

ALTER TABLE threads ADD COLUMN tag VARCHAR(255);