-- FileManager Access Database Schema
-- Standard MySQL structure for administrative portal modernization

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for area
-- ----------------------------
CREATE TABLE IF NOT EXISTS `area` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `status` varchar(20) DEFAULT 'Activo',
  `icon` varchar(50) DEFAULT 'box',
  `color` varchar(100) DEFAULT 'linear-gradient(135deg, #6366f1, #818cf8)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for user
-- ----------------------------
CREATE TABLE IF NOT EXISTS `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Activo',
  `password_hash` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for platform
-- ----------------------------
CREATE TABLE IF NOT EXISTS `platform` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `area_id` int(11) NOT NULL,
  `storage_path` varchar(255) DEFAULT NULL,
  `owner` varchar(100) DEFAULT NULL,
  `icon` varchar(50) DEFAULT 'box',
  `status` varchar(20) DEFAULT 'Activo',
  `can_download` tinyint(1) DEFAULT '0',
  `can_upload` tinyint(1) DEFAULT '0',
  `is_encrypted` tinyint(1) DEFAULT '0',
  `password` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `area_id` (`area_id`),
  CONSTRAINT `platform_ibfk_1` FOREIGN KEY (`area_id`) REFERENCES `area` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for access_request
-- ----------------------------
CREATE TABLE IF NOT EXISTS `access_request` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` varchar(20) DEFAULT 'Pendiente',
  `request_type` varchar(20) DEFAULT 'Usuario',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `processed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `platform_id` (`platform_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `access_request_ibfk_1` FOREIGN KEY (`platform_id`) REFERENCES `platform` (`id`),
  CONSTRAINT `access_request_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for audit_log
-- ----------------------------
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `target_type` varchar(50) DEFAULT NULL,
  `target_name` varchar(100) DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `user_email` varchar(100) DEFAULT NULL,
  `description` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `audit_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for system_settings
-- ----------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL DEFAULT '1',
  `portal_name` varchar(100) DEFAULT 'FileManager',
  `portal_logo_url` varchar(255) DEFAULT NULL,
  `portal_logo_type` varchar(10) DEFAULT 'image',
  `portal_icon` varchar(50) DEFAULT 'fa-box',
  `db_type` varchar(20) DEFAULT 'mysql',
  `db_host` varchar(100) DEFAULT 'localhost',
  `db_port` varchar(10) DEFAULT '3306',
  `db_user` varchar(100) DEFAULT NULL,
  `db_password` varchar(100) DEFAULT NULL,
  `db_name` varchar(100) DEFAULT 'filemanager_access',
  `db_ssl` tinyint(1) DEFAULT '0',
  `portal_logo_bg` varchar(20) DEFAULT '#6366f1',
  `portal_icon_color` varchar(20) DEFAULT '#ffffff',
  `smtp_host` varchar(100) DEFAULT NULL,
  `smtp_port` varchar(10) DEFAULT '587',
  `smtp_user` varchar(100) DEFAULT NULL,
  `smtp_password` varchar(100) DEFAULT NULL,
  `smtp_encryption` varchar(10) DEFAULT 'TLS',
  `smtp_auth` tinyint(1) DEFAULT '1',
  `smtp_from_name` varchar(100) DEFAULT 'FileManager',
  `smtp_from_email` varchar(100) DEFAULT NULL,
  `email_subject` varchar(200) DEFAULT 'Nueva Solicitud de Acceso - Portal FileManager',
  `email_body` text,
  `ldap_enabled` tinyint(1) DEFAULT '0',
  `ldap_server` varchar(100) DEFAULT NULL,
  `ldap_port` varchar(10) DEFAULT '389',
  `ldap_base_dn` varchar(200) DEFAULT NULL,
  `ldap_user_dn` varchar(200) DEFAULT NULL,
  `ldap_password` varchar(100) DEFAULT NULL,
  `ldap_use_ssl` tinyint(1) DEFAULT '0',
  `ldap_user_attribute` varchar(50) DEFAULT 'uid',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for user_areas
-- ----------------------------
CREATE TABLE IF NOT EXISTS `user_areas` (
  `user_id` int(11) NOT NULL,
  `area_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`,`area_id`),
  KEY `area_id` (`area_id`),
  CONSTRAINT `user_areas_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_areas_ibfk_2` FOREIGN KEY (`area_id`) REFERENCES `area` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Initial Essential Data
-- ----------------------------
INSERT IGNORE INTO `system_settings` (`id`, `portal_name`, `email_body`, `portal_logo_bg`, `portal_icon_color`) VALUES 
(1, 'FileManager', 'Hola {user_name},\n\nse ha recibido una solicitud para la plataforma {platform_name}.', '#6366f1', '#ffffff');

SET FOREIGN_KEY_CHECKS = 1;
