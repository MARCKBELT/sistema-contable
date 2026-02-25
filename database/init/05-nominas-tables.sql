-- =====================================================
-- TABLAS DE NÓMINAS (MULTIEMPRESA)
-- =====================================================

SET search_path TO nominas, auth, public;

-- Tabla de empleados
CREATE TABLE nominas.empleados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES auth.empresas(id) ON DELETE CASCADE,
    ci VARCHAR(20) NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    fecha_nacimiento DATE,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    cargo VARCHAR(100),
    departamento VARCHAR(100),
    fecha_ingreso DATE NOT NULL,
    salario_base DECIMAL(10,2) NOT NULL,
    tipo_contrato VARCHAR(50) CHECK (tipo_contrato IN ('INDEFINIDO', 'PLAZO_FIJO', 'CONSULTOR')),
    afp VARCHAR(50),
    caja_salud VARCHAR(50),
    cuenta_bancaria VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, ci)
);

-- Tabla de planillas
CREATE TABLE nominas.planillas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES auth.empresas(id) ON DELETE CASCADE,
    periodo VARCHAR(20) NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    anio INTEGER NOT NULL,
    tipo VARCHAR(20) DEFAULT 'MENSUAL' CHECK (tipo IN ('MENSUAL', 'QUINCENAL', 'SEMANAL')),
    fecha_pago DATE,
    total_ganado DECIMAL(15,2) DEFAULT 0,
    total_descuentos DECIMAL(15,2) DEFAULT 0,
    total_liquido DECIMAL(15,2) DEFAULT 0,
    total_aportes_patronales DECIMAL(15,2) DEFAULT 0,
    cerrada BOOLEAN DEFAULT false,
    fecha_cierre TIMESTAMP,
    usuario_cierre UUID REFERENCES auth.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, mes, anio, tipo)
);

-- Tabla de detalle de planillas
CREATE TABLE nominas.detalle_planillas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planilla_id UUID NOT NULL REFERENCES nominas.planillas(id) ON DELETE CASCADE,
    empleado_id UUID NOT NULL REFERENCES nominas.empleados(id),
    -- Ingresos
    salario_base DECIMAL(10,2) NOT NULL,
    bono_antiguedad DECIMAL(10,2) DEFAULT 0,
    horas_extra_50 DECIMAL(10,2) DEFAULT 0,
    horas_extra_100 DECIMAL(10,2) DEFAULT 0,
    bonos_adicionales DECIMAL(10,2) DEFAULT 0,
    comisiones DECIMAL(10,2) DEFAULT 0,
    total_ganado DECIMAL(10,2) DEFAULT 0,
    -- Descuentos
    afp_laboral DECIMAL(10,2) DEFAULT 0,
    caja_salud_laboral DECIMAL(10,2) DEFAULT 0,
    rc_iva DECIMAL(10,2) DEFAULT 0,
    prestamos DECIMAL(10,2) DEFAULT 0,
    anticipos DECIMAL(10,2) DEFAULT 0,
    total_descuentos DECIMAL(10,2) DEFAULT 0,
    -- Líquido pagable
    liquido_pagable DECIMAL(10,2) DEFAULT 0,
    -- Aportes patronales
    afp_patronal DECIMAL(10,2) DEFAULT 0,
    caja_salud_patronal DECIMAL(10,2) DEFAULT 0,
    pro_vivienda DECIMAL(10,2) DEFAULT 0,
    riesgo_profesional DECIMAL(10,2) DEFAULT 0,
    total_aportes_patronales DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_empleados_empresa ON nominas.empleados(empresa_id);
CREATE INDEX idx_empleados_activo ON nominas.empleados(empresa_id, activo);
CREATE INDEX idx_planillas_empresa ON nominas.planillas(empresa_id);
CREATE INDEX idx_planillas_periodo ON nominas.planillas(empresa_id, anio, mes);

-- Comentarios
COMMENT ON TABLE nominas.empleados IS 'Empleados por empresa (un empleado puede estar en varias empresas)';
COMMENT ON TABLE nominas.planillas IS 'Planillas de sueldos mensuales/quincenales por empresa';
COMMENT ON TABLE nominas.detalle_planillas IS 'Detalle de cálculo de cada empleado en la planilla';
