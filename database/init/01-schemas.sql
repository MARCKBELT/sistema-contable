-- =====================================================
-- SISTEMA CONTABLE BOLIVIA - ESQUEMAS
-- Versión: 1.1 MULTIEMPRESA
-- Fecha: 21 Febrero 2026
-- =====================================================

-- Esquema de autenticación y usuarios
CREATE SCHEMA IF NOT EXISTS auth;

-- Esquema de contabilidad
CREATE SCHEMA IF NOT EXISTS contabilidad;

-- Esquema de nóminas
CREATE SCHEMA IF NOT EXISTS nominas;

-- Esquema de facturación
CREATE SCHEMA IF NOT EXISTS facturacion;

-- Esquema compartido (UFV, parámetros globales)
CREATE SCHEMA IF NOT EXISTS shared;

-- Configurar search_path por defecto
ALTER DATABASE contable_db SET search_path TO auth, contabilidad, nominas, facturacion, shared, public;

COMMENT ON SCHEMA auth IS 'Esquema de autenticación y gestión de usuarios/empresas';
COMMENT ON SCHEMA contabilidad IS 'Esquema de contabilidad multiempresa (PUCT, comprobantes, reportes)';
COMMENT ON SCHEMA nominas IS 'Esquema de nóminas y gestión de empleados por empresa';
COMMENT ON SCHEMA facturacion IS 'Esquema de facturación y ventas por empresa';
COMMENT ON SCHEMA shared IS 'Esquema de datos compartidos (UFV, parámetros del sistema)';
