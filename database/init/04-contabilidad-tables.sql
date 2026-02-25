-- =====================================================
-- TABLAS DE CONTABILIDAD (MULTIEMPRESA)
-- =====================================================

SET search_path TO contabilidad, auth, public;

-- Tabla de cuentas contables (PUCT por empresa)
CREATE TABLE contabilidad.cuentas_contables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES auth.empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(10) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    nivel INTEGER NOT NULL CHECK (nivel BETWEEN 1 AND 5),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto')),
    naturaleza VARCHAR(10) NOT NULL CHECK (naturaleza IN ('deudora', 'acreedora')),
    es_imputable BOOLEAN DEFAULT false,
    -- Aplicabilidad por actividad económica
    aplica_comercial BOOLEAN DEFAULT true,
    aplica_servicios BOOLEAN DEFAULT true,
    aplica_transporte BOOLEAN DEFAULT true,
    aplica_industrial BOOLEAN DEFAULT true,
    aplica_petrolera BOOLEAN DEFAULT true,
    aplica_construccion BOOLEAN DEFAULT true,
    aplica_agropecuaria BOOLEAN DEFAULT true,
    aplica_minera BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, codigo)
);

-- Tabla de comprobantes contables
CREATE TABLE contabilidad.comprobantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES auth.empresas(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    prefijo VARCHAR(5) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('INGRESO', 'EGRESO', 'TRASPASO')),
    fecha DATE NOT NULL,
    glosa TEXT NOT NULL,
    total_debe DECIMAL(15,2) DEFAULT 0,
    total_haber DECIMAL(15,2) DEFAULT 0,
    tiene_respaldo BOOLEAN DEFAULT false,
    usuario_id UUID REFERENCES auth.usuarios(id),
    anulado BOOLEAN DEFAULT false,
    fecha_anulacion TIMESTAMP,
    motivo_anulacion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, tipo, numero)
);

-- Tabla de detalle de comprobantes
CREATE TABLE contabilidad.detalle_comprobantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comprobante_id UUID NOT NULL REFERENCES contabilidad.comprobantes(id) ON DELETE CASCADE,
    cuenta_id UUID NOT NULL REFERENCES contabilidad.cuentas_contables(id),
    debe DECIMAL(15,2) DEFAULT 0 CHECK (debe >= 0),
    haber DECIMAL(15,2) DEFAULT 0 CHECK (haber >= 0),
    CONSTRAINT check_debe_haber CHECK (
        (debe > 0 AND haber = 0) OR (haber > 0 AND debe = 0)
    )
);

-- Tabla de glosas frecuentes (para autocompletado)
CREATE TABLE contabilidad.glosas_frecuentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES auth.empresas(id) ON DELETE CASCADE,
    glosa TEXT NOT NULL,
    tipo_comprobante VARCHAR(20),
    frecuencia INTEGER DEFAULT 1,
    ultima_vez_usado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, glosa)
);

-- Índices para performance
CREATE INDEX idx_cuentas_empresa ON contabilidad.cuentas_contables(empresa_id);
CREATE INDEX idx_cuentas_codigo ON contabilidad.cuentas_contables(empresa_id, codigo);
CREATE INDEX idx_cuentas_nivel ON contabilidad.cuentas_contables(empresa_id, nivel);
CREATE INDEX idx_comprobantes_empresa ON contabilidad.comprobantes(empresa_id);
CREATE INDEX idx_comprobantes_fecha ON contabilidad.comprobantes(empresa_id, fecha);
CREATE INDEX idx_comprobantes_tipo ON contabilidad.comprobantes(empresa_id, tipo);
CREATE INDEX idx_detalle_comprobante ON contabilidad.detalle_comprobantes(comprobante_id);

-- Comentarios
COMMENT ON TABLE contabilidad.cuentas_contables IS 'Plan Único de Cuentas Tributario (PUCT) por empresa';
COMMENT ON TABLE contabilidad.comprobantes IS 'Comprobantes contables (numeración independiente por empresa y tipo)';
COMMENT ON TABLE contabilidad.detalle_comprobantes IS 'Detalle de movimientos contables (debe/haber)';
COMMENT ON TABLE contabilidad.glosas_frecuentes IS 'Glosas utilizadas frecuentemente para autocompletado';
COMMENT ON COLUMN contabilidad.comprobantes.tiene_respaldo IS 'Indica si el comprobante tiene documentación de respaldo adjunta';
