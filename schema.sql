-- ============================================
-- ESQUEMA COMPLETO DE BASE DE DATOS
-- Sistema de Gestión de Inventario Táctico
-- ============================================

CREATE DATABASE IF NOT EXISTS tactical_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE tactical_inventory;

-- ============================================
-- 1. TABLA: users (Usuarios/Autenticación)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  access_code VARCHAR(50) UNIQUE NOT NULL,
  role ENUM('Admin', 'AlmacenCedis', 'AlmacenAcuna', 'AlmacenNld') NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 2. TABLA: inventory_items (Items de Inventario)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  description VARCHAR(255) NOT NULL,
  size VARCHAR(50),
  stock_new INT DEFAULT 0,
  stock_recovered INT DEFAULT 0,
  stock_min INT DEFAULT 0,
  stock_max INT DEFAULT 0,
  site ENUM('CEDIS', 'ACUÑA', 'NLD') NOT NULL,
  status ENUM('En Stock', 'Reordenar', 'Agotado') DEFAULT 'En Stock',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_item_site (code, site)
);

-- ============================================
-- 3. TABLA: employees (Empleados/Colaboradores)
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  service VARCHAR(100) NOT NULL,
  hire_date DATE NOT NULL,
  last_renewal_date DATE,
  second_uniform_date DATE,
  next_renewal_date DATE,
  status ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
  vest_size VARCHAR(10),
  shirt_size VARCHAR(10),
  pants_size VARCHAR(10),
  shoe_size VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 4. TABLA: pending_employees (Empleados Pendientes)
-- ============================================
CREATE TABLE IF NOT EXISTS pending_employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(50),
  full_name VARCHAR(255) NOT NULL,
  service VARCHAR(100) NOT NULL,
  hire_date DATE NOT NULL,
  last_renewal_date DATE,
  second_uniform_date DATE,
  next_renewal_date DATE,
  status ENUM('Pendiente ID', 'Listo para aprobar') DEFAULT 'Pendiente ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 5. TABLA: entries (Entradas de Inventario)
-- ============================================
CREATE TABLE IF NOT EXISTS entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  site ENUM('CEDIS', 'ACUÑA', 'NLD') NOT NULL,
  total_items INT DEFAULT 0,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 6. TABLA: entry_items (Items de Entrada)
-- ============================================
CREATE TABLE IF NOT EXISTS entry_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entry_id INT NOT NULL,
  code VARCHAR(50) NOT NULL,
  description VARCHAR(255) NOT NULL,
  qty INT NOT NULL,
  FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
);

-- ============================================
-- 7. TABLA: dispatches (Salidas/Despachos)
-- ============================================
CREATE TABLE IF NOT EXISTS dispatches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  employee_id VARCHAR(50) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  service VARCHAR(100) NOT NULL,
  site ENUM('CEDIS', 'ACUÑA', 'NLD') NOT NULL,
  dispatch_type ENUM('Normal', '2do uniforme', 'Próxima renovación') DEFAULT 'Normal',
  status ENUM('Pendiente', 'Aprobado', 'Cancelado') DEFAULT 'Pendiente',
  total_items INT DEFAULT 0,
  created_by VARCHAR(100) NOT NULL,
  approved_by VARCHAR(100),
  approved_at TIMESTAMP NULL,
  receipt_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 8. TABLA: dispatch_items (Items de Salida)
-- ============================================
CREATE TABLE IF NOT EXISTS dispatch_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dispatch_id INT NOT NULL,
  code VARCHAR(50) NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (dispatch_id) REFERENCES dispatches(id) ON DELETE CASCADE
);

-- ============================================
-- 9. TABLA: recoveries (Recuperaciones)
-- ============================================
CREATE TABLE IF NOT EXISTS recoveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  employee_id VARCHAR(50) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  total_items INT DEFAULT 0,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 10. TABLA: recovery_items (Items Recuperados)
-- ============================================
CREATE TABLE IF NOT EXISTS recovery_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recovery_id INT NOT NULL,
  code VARCHAR(50) NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  destination ENUM('CEDIS', 'ACUÑA', 'NLD', 'Desecho') NOT NULL,
  FOREIGN KEY (recovery_id) REFERENCES recoveries(id) ON DELETE CASCADE
);

-- ============================================
-- 11. TABLA: orders (Pedidos)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  supplier VARCHAR(255),
  status ENUM('Pendiente', 'En tránsito', 'Recibido', 'Cancelado') DEFAULT 'Pendiente',
  total_amount DECIMAL(10, 2) DEFAULT 0,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 12. TABLA: order_items (Items de Pedido)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  code VARCHAR(50) NOT NULL,
  description VARCHAR(255) NOT NULL,
  qty INT NOT NULL,
  unit_price DECIMAL(10, 2) DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ============================================
-- 13. TABLA: cyclic_inventory_tasks (Tareas de Inventario Cíclico)
-- ============================================
CREATE TABLE IF NOT EXISTS cyclic_inventory_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  assigned_to VARCHAR(100) NOT NULL,
  status ENUM('Pendiente', 'Completado') DEFAULT 'Pendiente',
  completed_at TIMESTAMP NULL,
  completed_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 14. TABLA: cyclic_inventory_items (Items de Inventario Cíclico)
-- ============================================
CREATE TABLE IF NOT EXISTS cyclic_inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  code VARCHAR(50) NOT NULL,
  description VARCHAR(255) NOT NULL,
  size VARCHAR(50),
  theoretical_stock INT NOT NULL,
  physical_count INT,
  difference INT,
  FOREIGN KEY (task_id) REFERENCES cyclic_inventory_tasks(id) ON DELETE CASCADE
);

-- ============================================
-- INSERTAR USUARIOS INICIALES
-- ============================================
INSERT INTO users (access_code, role, name) VALUES
('Tactical2025', 'Admin', 'Administrador'),
('Cedis2025', 'AlmacenCedis', 'Almacén CEDIS'),
('Acuña2025', 'AlmacenAcuna', 'Almacén ACUÑA'),
('Nld2025', 'AlmacenNld', 'Almacén NLD')
ON DUPLICATE KEY UPDATE name=VALUES(name);

