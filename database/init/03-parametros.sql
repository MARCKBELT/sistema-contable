-- ============================================
-- TABLA: PARAMETROS DEL SISTEMA
-- ============================================
CREATE TABLE parametros_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    valor VARCHAR(500) NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- text, number, date, boolean
    categoria VARCHAR(50), -- laboral, tributario, financiero, general
    descripcion TEXT,
    es_editable BOOLEAN DEFAULT true,
    actualizado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DATOS INICIALES - PARÁMETROS LABORALES
-- ============================================
INSERT INTO parametros_sistema (empresa_id, codigo, nombre, valor, tipo, categoria, descripcion, es_editable) VALUES
-- Salario Mínimo Nacional
('11111111-1111-1111-1111-111111111111', 'SALARIO_MINIMO_NACIONAL', 'Salario Mínimo Nacional', '3300', 'number', 'laboral', 'Salario mínimo nacional vigente según Decreto Supremo', true),

-- Aportes Laborales
('11111111-1111-1111-1111-111111111111', 'APORTE_LABORAL_AFP', 'Aporte Laboral AFP', '12.71', 'number', 'laboral', 'Porcentaje de aporte del trabajador a la AFP', true),
('11111111-1111-1111-1111-111111111111', 'APORTE_PATRONAL_AFP', 'Aporte Patronal AFP', '3.5', 'number', 'laboral', 'Porcentaje de aporte del empleador a la AFP', true),
('11111111-1111-1111-1111-111111111111', 'APORTE_CAJA_SALUD', 'Aporte Caja de Salud', '10', 'number', 'laboral', 'Porcentaje de aporte del empleador a Caja de Salud', true),
('11111111-1111-1111-1111-111111111111', 'APORTE_RIESGO_PROFESIONAL', 'Aporte Riesgo Profesional', '1.71', 'number', 'laboral', 'Porcentaje de aporte por riesgo profesional', true),
('11111111-1111-1111-1111-111111111111', 'APORTE_VIVIENDA', 'Aporte Pro Vivienda', '2', 'number', 'laboral', 'Porcentaje de aporte para vivienda', true),

-- Provisiones
('11111111-1111-1111-1111-111111111111', 'PROVISION_AGUINALDO', 'Provisión Aguinaldo', '8.33', 'number', 'laboral', 'Porcentaje de provisión para aguinaldo (1/12)', true),
('11111111-1111-1111-1111-111111111111', 'PROVISION_INDEMNIZACION', 'Provisión Indemnización', '8.33', 'number', 'laboral', 'Porcentaje de provisión para indemnización (1/12)', true),

-- RC-IVA
('11111111-1111-1111-1111-111111111111', 'RC_IVA', 'RC-IVA', '13', 'number', 'tributario', 'Porcentaje de Régimen Complementario al IVA', true);

-- ============================================
-- DATOS INICIALES - TIPOS DE CAMBIO
-- ============================================
INSERT INTO parametros_sistema (empresa_id, codigo, nombre, valor, tipo, categoria, descripcion, es_editable) VALUES
('11111111-1111-1111-1111-111111111111', 'TIPO_CAMBIO_OFICIAL', 'Tipo de Cambio Oficial', '6.96', 'number', 'financiero', 'Tipo de cambio oficial del BCB', true),
('11111111-1111-1111-1111-111111111111', 'TIPO_CAMBIO_REFERENCIAL', 'Tipo de Cambio Referencial', '8.90', 'number', 'financiero', 'Tipo de cambio referencial del mercado', true),
('11111111-1111-1111-1111-111111111111', 'TIPO_CAMBIO_PARALELO', 'Tipo de Cambio Paralelo', '9.60', 'number', 'financiero', 'Tipo de cambio del mercado paralelo', true),
('11111111-1111-1111-1111-111111111111', 'AUTO_ACTUALIZAR_TC', 'Auto-actualizar Tipo de Cambio', 'false', 'boolean', 'financiero', 'Actualizar automáticamente desde API del BCB', true);

-- ============================================
-- DATOS INICIALES - SIAT
-- ============================================
INSERT INTO parametros_sistema (empresa_id, codigo, nombre, valor, tipo, categoria, descripcion, es_editable) VALUES
('11111111-1111-1111-1111-111111111111', 'SIAT_AMBIENTE', 'SIAT Ambiente', '2', 'number', 'tributario', '1=Producción, 2=Pruebas', true),
('11111111-1111-1111-1111-111111111111', 'SIAT_MODALIDAD', 'SIAT Modalidad', '1', 'number', 'tributario', '1=Electrónica en Línea, 2=Computarizada', true);

-- Índices
CREATE INDEX idx_parametros_empresa ON parametros_sistema(empresa_id);
CREATE INDEX idx_parametros_codigo ON parametros_sistema(codigo);
CREATE INDEX idx_parametros_categoria ON parametros_sistema(categoria);

COMMENT ON TABLE parametros_sistema IS 'Parámetros configurables del sistema (salarios, tipos de cambio, porcentajes, etc)';
