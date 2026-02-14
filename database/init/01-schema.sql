-- ============================================
-- SISTEMA CONTABLE BOLIVIANO
-- Schema Principal Multi-Tenant
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLA: EMPRESAS (Multi-tenant)
-- ============================================
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nit VARCHAR(20) UNIQUE NOT NULL,
    razon_social VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    tipo_empresa VARCHAR(50) NOT NULL, -- productiva, comercial, servicios
    actividad_economica VARCHAR(100),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    ciudad VARCHAR(50) DEFAULT 'La Paz',
    pais VARCHAR(50) DEFAULT 'Bolivia',
    logo_url TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_constitucion DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: USUARIOS
-- ============================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    ci VARCHAR(20),
    telefono VARCHAR(20),
    rol VARCHAR(50) NOT NULL, -- super_admin, admin, contador, auditor, usuario
    cargo VARCHAR(100),
    foto_url TEXT,
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: MÓDULOS (Permisos por módulo)
-- ============================================
CREATE TABLE modulos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    icono VARCHAR(50),
    ruta VARCHAR(100),
    activo BOOLEAN DEFAULT true
);

-- ============================================
-- TABLA: PERMISOS (Relación Usuario-Módulo)
-- ============================================
CREATE TABLE permisos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    modulo_id UUID REFERENCES modulos(id) ON DELETE CASCADE,
    puede_leer BOOLEAN DEFAULT false,
    puede_crear BOOLEAN DEFAULT false,
    puede_editar BOOLEAN DEFAULT false,
    puede_eliminar BOOLEAN DEFAULT false,
    UNIQUE(usuario_id, modulo_id)
);

-- ============================================
-- CONTABILIDAD: PLAN DE CUENTAS
-- ============================================
CREATE TABLE plan_cuentas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    nivel INTEGER NOT NULL, -- 1=Mayor, 2=Submay or, 3=Cuenta, 4=Subcuenta
    codigo_padre VARCHAR(20),
    tipo_cuenta VARCHAR(20) NOT NULL, -- activo, pasivo, patrimonio, ingreso, egreso
    moneda VARCHAR(3) DEFAULT 'BOB', -- BOB, USD
    acepta_movimientos BOOLEAN DEFAULT true,
    es_monetaria BOOLEAN DEFAULT true, -- para diferenciar cuentas monetarias/no monetarias
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CONTABILIDAD: TIPOS DE CAMBIO
-- ============================================
CREATE TABLE tipos_cambio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    moneda VARCHAR(3) DEFAULT 'USD',
    tipo_oficial DECIMAL(10,4) NOT NULL,
    tipo_referencial DECIMAL(10,4),
    tipo_paralelo DECIMAL(10,4),
    fuente VARCHAR(50), -- BCB, manual
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, fecha, moneda)
);

-- ============================================
-- CONTABILIDAD: COMPROBANTES
-- ============================================
CREATE TABLE comprobantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    numero_comprobante VARCHAR(50) NOT NULL,
    tipo_comprobante VARCHAR(50) NOT NULL, -- ingreso, egreso, traspaso, apertura, cierre, ajuste
    glosa TEXT NOT NULL,
    fecha DATE NOT NULL,
    tipo_cambio_oficial DECIMAL(10,4),
    tipo_cambio_referencial DECIMAL(10,4),
    estado VARCHAR(20) DEFAULT 'borrador', -- borrador, aprobado, anulado
    usuario_creador_id UUID REFERENCES usuarios(id),
    usuario_aprobador_id UUID REFERENCES usuarios(id),
    fecha_aprobacion TIMESTAMP,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, numero_comprobante)
);

-- ============================================
-- CONTABILIDAD: DETALLE COMPROBANTES
-- ============================================
CREATE TABLE comprobante_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comprobante_id UUID REFERENCES comprobantes(id) ON DELETE CASCADE,
    cuenta_id UUID REFERENCES plan_cuentas(id),
    debe_bs DECIMAL(15,2) DEFAULT 0,
    haber_bs DECIMAL(15,2) DEFAULT 0,
    debe_usd DECIMAL(15,2) DEFAULT 0,
    haber_usd DECIMAL(15,2) DEFAULT 0,
    glosa TEXT,
    centro_costo VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- NÓMINAS: EMPLEADOS
-- ============================================
CREATE TABLE empleados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    codigo_empleado VARCHAR(20) UNIQUE NOT NULL,
    ci VARCHAR(20) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    sexo CHAR(1), -- M, F
    estado_civil VARCHAR(20),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    cargo VARCHAR(100),
    departamento VARCHAR(100),
    fecha_ingreso DATE NOT NULL,
    fecha_retiro DATE,
    tipo_contrato VARCHAR(50), -- indefinido, plazo_fijo, eventual
    salario_basico DECIMAL(10,2) NOT NULL,
    bono_antiguedad DECIMAL(10,2) DEFAULT 0,
    otros_bonos DECIMAL(10,2) DEFAULT 0,
    banco VARCHAR(100),
    numero_cuenta VARCHAR(50),
    afp VARCHAR(50), -- GESTORA, FUTURO, PREVISION
    caja_salud VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    foto_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- NÓMINAS: PLANILLAS
-- ============================================
CREATE TABLE planillas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    periodo VARCHAR(7) NOT NULL, -- YYYY-MM
    tipo_planilla VARCHAR(50) NOT NULL, -- mensual, aguinaldo, finiquito
    fecha_pago DATE,
    salario_minimo_nacional DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'borrador', -- borrador, cerrado, pagado
    total_ganado DECIMAL(15,2),
    total_descuentos DECIMAL(15,2),
    total_liquido DECIMAL(15,2),
    total_aportes_patronales DECIMAL(15,2),
    usuario_creador_id UUID REFERENCES usuarios(id),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, periodo, tipo_planilla)
);

-- ============================================
-- NÓMINAS: DETALLE PLANILLAS
-- ============================================
CREATE TABLE planilla_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    planilla_id UUID REFERENCES planillas(id) ON DELETE CASCADE,
    empleado_id UUID REFERENCES empleados(id),
    dias_trabajados INTEGER DEFAULT 30,
    horas_extra DECIMAL(5,2) DEFAULT 0,
    
    -- HABERES
    salario_basico DECIMAL(10,2) NOT NULL,
    bono_antiguedad DECIMAL(10,2) DEFAULT 0,
    horas_extra_monto DECIMAL(10,2) DEFAULT 0,
    otros_bonos DECIMAL(10,2) DEFAULT 0,
    total_ganado DECIMAL(10,2) NOT NULL,
    
    -- DESCUENTOS LABORALES
    aporte_afp DECIMAL(10,2) DEFAULT 0, -- 12.71% o 11%
    aporte_solidario DECIMAL(10,2) DEFAULT 0, -- Ley 065
    rc_iva DECIMAL(10,2) DEFAULT 0,
    otros_descuentos DECIMAL(10,2) DEFAULT 0,
    total_descuentos DECIMAL(10,2) NOT NULL,
    
    -- LÍQUIDO PAGABLE
    liquido_pagable DECIMAL(10,2) NOT NULL,
    
    -- APORTES PATRONALES
    aporte_patronal_afp DECIMAL(10,2) DEFAULT 0, -- 3.5%
    aporte_caja_salud DECIMAL(10,2) DEFAULT 0, -- 10%
    aporte_riesgo_profesional DECIMAL(10,2) DEFAULT 0, -- 1.71%
    aporte_vivienda DECIMAL(10,2) DEFAULT 0, -- 2%
    total_aportes_patronales DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FACTURACIÓN: CLIENTES
-- ============================================
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    nit VARCHAR(20) NOT NULL,
    razon_social VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    ciudad VARCHAR(50),
    tipo_cliente VARCHAR(50), -- natural, juridico
    credito_maximo DECIMAL(15,2) DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, nit)
);

-- ============================================
-- FACTURACIÓN: PRODUCTOS/SERVICIOS
-- ============================================
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL, -- producto, servicio
    unidad_medida VARCHAR(20), -- unidad, kg, litro, hora, etc
    precio_venta DECIMAL(10,2) NOT NULL,
    precio_compra DECIMAL(10,2),
    stock_actual DECIMAL(10,2) DEFAULT 0,
    stock_minimo DECIMAL(10,2) DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FACTURACIÓN: FACTURAS
-- ============================================
CREATE TABLE facturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id),
    numero_factura VARCHAR(50) NOT NULL,
    codigo_autorizacion VARCHAR(100), -- SIAT
    cuf VARCHAR(100), -- Código Único de Factura SIAT
    fecha_emision TIMESTAMP NOT NULL,
    fecha_limite_emision TIMESTAMP,
    moneda VARCHAR(3) DEFAULT 'BOB',
    tipo_cambio DECIMAL(10,4),
    subtotal DECIMAL(15,2) NOT NULL,
    descuento DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'emitida', -- emitida, anulada, pagada
    tipo_factura VARCHAR(50), -- compra_venta, nota_fiscal, exportacion
    metodo_pago VARCHAR(50),
    leyenda TEXT,
    qr_data TEXT, -- Datos para generar QR
    xml_firmado TEXT, -- XML firmado para SIAT
    usuario_emisor_id UUID REFERENCES usuarios(id),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, numero_factura)
);

-- ============================================
-- FACTURACIÓN: DETALLE FACTURAS
-- ============================================
CREATE TABLE factura_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factura_id UUID REFERENCES facturas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================
CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_plan_cuentas_empresa ON plan_cuentas(empresa_id);
CREATE INDEX idx_plan_cuentas_codigo ON plan_cuentas(codigo);
CREATE INDEX idx_comprobantes_empresa ON comprobantes(empresa_id);
CREATE INDEX idx_comprobantes_fecha ON comprobantes(fecha);
CREATE INDEX idx_empleados_empresa ON empleados(empresa_id);
CREATE INDEX idx_planillas_empresa ON planillas(empresa_id);
CREATE INDEX idx_planillas_periodo ON planillas(periodo);
CREATE INDEX idx_facturas_empresa ON facturas(empresa_id);
CREATE INDEX idx_facturas_fecha ON facturas(fecha_emision);

-- ============================================
-- COMENTARIOS DE TABLAS
-- ============================================
COMMENT ON TABLE empresas IS 'Tabla multi-tenant para gestionar múltiples empresas';
COMMENT ON TABLE usuarios IS 'Usuarios del sistema con roles y permisos';
COMMENT ON TABLE plan_cuentas IS 'Plan de cuentas contable según normas bolivianas';
COMMENT ON TABLE tipos_cambio IS 'Tipos de cambio históricos (oficial, referencial, paralelo)';
COMMENT ON TABLE comprobantes IS 'Comprobantes contables (asientos)';
COMMENT ON TABLE empleados IS 'Empleados de la empresa para módulo de nóminas';
COMMENT ON TABLE planillas IS 'Planillas de sueldos mensuales';
COMMENT ON TABLE facturas IS 'Facturas electrónicas con integración SIAT';
