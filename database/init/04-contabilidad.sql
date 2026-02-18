-- ============================================
-- MÓDULO DE CONTABILIDAD
-- ============================================

-- ============================================
-- TABLA: CUENTAS CONTABLES
-- Propósito: Plan de Cuentas jerárquico
-- ============================================
CREATE TABLE cuentas_contables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    nivel INTEGER NOT NULL, -- 1=Mayor, 2=Submay, 3=Cuenta, 4=Subcuenta
    cuenta_padre_id UUID REFERENCES cuentas_contables(id),
    tipo VARCHAR(20) NOT NULL, -- activo, pasivo, patrimonio, ingreso, gasto
    naturaleza VARCHAR(10) NOT NULL, -- deudora, acreedora
    es_imputable BOOLEAN DEFAULT false, -- Si acepta movimientos
    descripcion TEXT,
    saldo_inicial DECIMAL(15,2) DEFAULT 0,
    saldo_actual DECIMAL(15,2) DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: COMPROBANTES
-- Propósito: Encabezado de asientos contables
-- ============================================
CREATE TABLE comprobantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    numero_comprobante VARCHAR(20) UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- ingreso, egreso, traspaso
    fecha DATE NOT NULL,
    glosa TEXT NOT NULL,
    total_debe DECIMAL(15,2) NOT NULL,
    total_haber DECIMAL(15,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'borrador', -- borrador, aprobado, anulado
    usuario_id UUID REFERENCES usuarios(id),
    aprobado_por UUID REFERENCES usuarios(id),
    fecha_aprobacion TIMESTAMP,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: DETALLE DE COMPROBANTES
-- Propósito: Líneas de débito/crédito
-- ============================================
CREATE TABLE detalle_comprobantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comprobante_id UUID REFERENCES comprobantes(id) ON DELETE CASCADE,
    cuenta_id UUID REFERENCES cuentas_contables(id),
    glosa TEXT,
    debe DECIMAL(15,2) DEFAULT 0,
    haber DECIMAL(15,2) DEFAULT 0,
    orden INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX idx_cuentas_empresa ON cuentas_contables(empresa_id);
CREATE INDEX idx_cuentas_codigo ON cuentas_contables(codigo);
CREATE INDEX idx_cuentas_tipo ON cuentas_contables(tipo);
CREATE INDEX idx_cuentas_padre ON cuentas_contables(cuenta_padre_id);

CREATE INDEX idx_comprobantes_empresa ON comprobantes(empresa_id);
CREATE INDEX idx_comprobantes_fecha ON comprobantes(fecha);
CREATE INDEX idx_comprobantes_tipo ON comprobantes(tipo);
CREATE INDEX idx_comprobantes_numero ON comprobantes(numero_comprobante);

CREATE INDEX idx_detalle_comprobante ON detalle_comprobantes(comprobante_id);
CREATE INDEX idx_detalle_cuenta ON detalle_comprobantes(cuenta_id);

-- Comentarios
COMMENT ON TABLE cuentas_contables IS 'Plan de cuentas jerárquico del sistema contable';
COMMENT ON TABLE comprobantes IS 'Encabezado de asientos contables (ingreso, egreso, traspaso)';
COMMENT ON TABLE detalle_comprobantes IS 'Detalle de movimientos contables (debe y haber)';

-- ============================================
-- DATOS INICIALES: PLAN DE CUENTAS BOLIVIANO
-- ============================================

-- ACTIVO (1.0.00.00)
INSERT INTO cuentas_contables (empresa_id, codigo, nombre, nivel, tipo, naturaleza, es_imputable) VALUES
('11111111-1111-1111-1111-111111111111', '1', 'ACTIVO', 1, 'activo', 'deudora', false),
('11111111-1111-1111-1111-111111111111', '1.1', 'ACTIVO CORRIENTE', 2, 'activo', 'deudora', false),
('11111111-1111-1111-1111-111111111111', '1.1.01', 'DISPONIBLE', 3, 'activo', 'deudora', false),
('11111111-1111-1111-1111-111111111111', '1.1.01.01', 'Caja', 4, 'activo', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '1.1.01.02', 'Caja Chica', 4, 'activo', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '1.1.01.03', 'Banco Cuenta Corriente', 4, 'activo', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '1.1.01.04', 'Banco Caja de Ahorro', 4, 'activo', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '1.1.02', 'EXIGIBLE', 3, 'activo', 'deudora', false),
('11111111-1111-1111-1111-111111111111', '1.1.02.01', 'Cuentas por Cobrar Clientes', 4, 'activo', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '1.1.02.02', 'Documentos por Cobrar', 4, 'activo', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '1.1.02.03', 'Crédito Fiscal IVA', 4, 'activo', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '1.1.03', 'REALIZABLE', 3, 'activo', 'deudora', false),
('11111111-1111-1111-1111-111111111111', '1.1.03.01', 'Inventario de Mercaderías', 4, 'activo', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '1.1.03.02', 'Inventario de Productos Terminados', 4, 'activo', 'deudora', true);

-- ACTIVO NO CORRIENTE
INSERT INTO cuentas_contables (empresa_id, codigo, nombre, nivel, tipo, naturaleza, es_imputable) VALUES
('11111111-1111-1111-1111-111111111111', '1.2', 'ACTIVO NO CORRIENTE', 2, 'activo', 'deudora', false),
('11111111-1111-1111-1111-111111111111', '1.2.01', 'ACTIVO FIJO', 3, 'activo', 'deudora', false),
('11111111-1111-1111-1111-111111111111', '1.2.01.01', 'Muebles y Enseres', 4, 'activo', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '1.2.01.02', 'Equipos de Computación', 4, 'activo', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '1.2.01.03', 'Vehículos', 4, 'activo', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '1.2.01.04', 'Edificios', 4, 'activo', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '1.2.01.05', 'Depreciación Acumulada', 4, 'activo', 'acreedora', true);

-- PASIVO (2.0.00.00)
INSERT INTO cuentas_contables (empresa_id, codigo, nombre, nivel, tipo, naturaleza, es_imputable) VALUES
('11111111-1111-1111-1111-111111111111', '2', 'PASIVO', 1, 'pasivo', 'acreedora', false),
('11111111-1111-1111-1111-111111111111', '2.1', 'PASIVO CORRIENTE', 2, 'pasivo', 'acreedora', false),
('11111111-1111-1111-1111-111111111111', '2.1.01', 'OBLIGACIONES', 3, 'pasivo', 'acreedora', false),
('11111111-1111-1111-1111-111111111111', '2.1.01.01', 'Cuentas por Pagar Proveedores', 4, 'pasivo', 'acreedora', true),
('11111111-1111-1111-1111-111111111111', '2.1.01.02', 'Documentos por Pagar', 4, 'pasivo', 'acreedora', true),
('11111111-1111-1111-1111-111111111111', '2.1.01.03', 'Débito Fiscal IVA', 4, 'pasivo', 'acreedora', true),
('11111111-1111-1111-1111-111111111111', '2.1.01.04', 'Retenciones por Pagar', 4, 'pasivo', 'acreedora', true),
('11111111-1111-1111-1111-111111111111', '2.1.01.05', 'Sueldos y Salarios por Pagar', 4, 'pasivo', 'acreedora', true),
('11111111-1111-1111-1111-111111111111', '2.1.01.06', 'Aportes Laborales por Pagar', 4, 'pasivo', 'acreedora', true),
('11111111-1111-1111-1111-111111111111', '2.1.01.07', 'RC-IVA por Pagar', 4, 'pasivo', 'acreedora', true);

-- PATRIMONIO (3.0.00.00)
INSERT INTO cuentas_contables (empresa_id, codigo, nombre, nivel, tipo, naturaleza, es_imputable) VALUES
('11111111-1111-1111-1111-111111111111', '3', 'PATRIMONIO', 1, 'patrimonio', 'acreedora', false),
('11111111-1111-1111-1111-111111111111', '3.1', 'CAPITAL', 2, 'patrimonio', 'acreedora', false),
('11111111-1111-1111-1111-111111111111', '3.1.01', 'Capital Social', 3, 'patrimonio', 'acreedora', true),
('11111111-1111-1111-1111-111111111111', '3.2', 'RESULTADOS', 2, 'patrimonio', 'acreedora', false),
('11111111-1111-1111-1111-111111111111', '3.2.01', 'Resultados Acumulados', 3, 'patrimonio', 'acreedora', true),
('11111111-1111-1111-1111-111111111111', '3.2.02', 'Resultado del Ejercicio', 3, 'patrimonio', 'acreedora', true);

-- INGRESOS (4.0.00.00)
INSERT INTO cuentas_contables (empresa_id, codigo, nombre, nivel, tipo, naturaleza, es_imputable) VALUES
('11111111-1111-1111-1111-111111111111', '4', 'INGRESOS', 1, 'ingreso', 'acreedora', false),
('11111111-1111-1111-1111-111111111111', '4.1', 'INGRESOS OPERACIONALES', 2, 'ingreso', 'acreedora', false),
('11111111-1111-1111-1111-111111111111', '4.1.01', 'Ventas', 3, 'ingreso', 'acreedora', true),
('11111111-1111-1111-1111-111111111111', '4.1.02', 'Prestación de Servicios', 3, 'ingreso', 'acreedora', true),
('11111111-1111-1111-1111-111111111111', '4.2', 'OTROS INGRESOS', 2, 'ingreso', 'acreedora', false),
('11111111-1111-1111-1111-111111111111', '4.2.01', 'Ingresos Financieros', 3, 'ingreso', 'acreedora', true),
('11111111-1111-1111-1111-111111111111', '4.2.02', 'Diferencia de Cambio', 3, 'ingreso', 'acreedora', true);

-- GASTOS (5.0.00.00)
INSERT INTO cuentas_contables (empresa_id, codigo, nombre, nivel, tipo, naturaleza, es_imputable) VALUES
('11111111-1111-1111-1111-111111111111', '5', 'GASTOS', 1, 'gasto', 'deudora', false),
('11111111-1111-1111-1111-111111111111', '5.1', 'COSTO DE VENTAS', 2, 'gasto', 'deudora', false),
('11111111-1111-1111-1111-111111111111', '5.1.01', 'Costo de Ventas', 3, 'gasto', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '5.2', 'GASTOS OPERACIONALES', 2, 'gasto', 'deudora', false),
('11111111-1111-1111-1111-111111111111', '5.2.01', 'Sueldos y Salarios', 3, 'gasto', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '5.2.02', 'Aportes Patronales', 3, 'gasto', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '5.2.03', 'Alquileres', 3, 'gasto', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '5.2.04', 'Servicios Básicos', 3, 'gasto', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '5.2.05', 'Depreciación', 3, 'gasto', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '5.3', 'GASTOS FINANCIEROS', 2, 'gasto', 'deudora', false),
('11111111-1111-1111-1111-111111111111', '5.3.01', 'Intereses Bancarios', 3, 'gasto', 'deudora', true),
('11111111-1111-1111-1111-111111111111', '5.3.02', 'Comisiones Bancarias', 3, 'gasto', 'deudora', true);
