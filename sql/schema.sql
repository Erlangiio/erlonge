CREATE DATABASE IF NOT EXISTS watch_store;
USE watch_store;

-- Brands table
CREATE TABLE brands (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  img VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Collections table
CREATE TABLE collections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  img VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Watches table
CREATE TABLE watches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  tag VARCHAR(50),
  text VARCHAR(255),
  size VARCHAR(20),
  color VARCHAR(100),
  img VARCHAR(500),
  images JSON,                       -- store array of image URLs
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  brand_id INT NOT NULL,
  collection_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE RESTRICT
);

-- Reviews table
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  watch_id INT NOT NULL,
  name VARCHAR(100),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (watch_id) REFERENCES watches(id) ON DELETE CASCADE
);

-- Admins table (passwords hashed with bcrypt)
CREATE TABLE admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('yes','no') DEFAULT 'yes',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  watch_id INT NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  status ENUM('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (watch_id) REFERENCES watches(id) ON DELETE RESTRICT
);

-- Insert sample data (optional)
INSERT INTO brands (name, slug, img) VALUES
('ROLEX', 'rolex', 'https://images.unsplash.com/...'),
('OMEGA', 'omega', 'https://...'),
('PATEK PHILIPPE', 'patek-philippe', 'https://...'),
('AUDEMARS PIGUET', 'audemars-piguet', 'https://...'),
('CARTIER', 'cartier', 'https://...'),
('TAG HEUER', 'tag-heuer', 'https://...');

INSERT INTO collections (name, slug, img) VALUES
('AUTOMATIC', 'automatic', 'https://...'),
('CINÉMA', 'cinema', 'https://...'),
('PLONGÉE', 'plongee', 'https://...'),
('ÉDITION LIMITÉE', 'edition-limitee', 'https://...'),
('HÉRITAGE', 'heritage', 'https://...'),
('CHRONOGRAPHE', 'chronographe', 'https://...');

-- Insert your existing watches...