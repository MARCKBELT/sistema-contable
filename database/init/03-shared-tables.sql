-- =====================================================
-- TABLAS COMPARTIDAS (UFV, PARÁMETROS GLOBALES)
-- =====================================================

SET search_path TO shared, public;

-- Tabla de UFV (Unidad de Fomento a la Vivienda)
CREATE TABLE shared.ufv_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE UNIQUE NOT NULL,
    valor DECIMAL(10,5) NOT NULL CHECK (valor > 0),
    fuente VARCHAR(50) DEFAULT 'BCB',
    usuario_modificacion UUID REFERENCES auth.usuarios(id),
    fecha_modificacion TIMESTAMP,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de parámetros del sistema
CREATE TABLE shared.parametros_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) UNIQUE NOT NULL,
    valor VARCHAR(50) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    tipo_dato VARCHAR(20) DEFAULT 'text',
    descripcion TEXT,
    editable BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de auditoría de cambios en parámetros
CREATE TABLE shared.auditoria_parametros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parametro_id UUID REFERENCES shared.parametros_sistema(id),
    usuario_id UUID REFERENCES auth.usuarios(id),
    valor_anterior VARCHAR(50),
    valor_nuevo VARCHAR(50),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_ufv_fecha ON shared.ufv_historico(fecha DESC);
CREATE INDEX idx_parametros_categoria ON shared.parametros_sistema(categoria);

-- Comentarios
COMMENT ON TABLE shared.ufv_historico IS 'Histórico de UFV del Banco Central de Bolivia (10+ años)';
COMMENT ON TABLE shared.parametros_sistema IS 'Parámetros globales del sistema (salario mínimo, impuestos, etc.)';
COMMENT ON TABLE shared.auditoria_parametros IS 'Auditoría de cambios en parámetros del sistema';
