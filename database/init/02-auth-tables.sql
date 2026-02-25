-- =====================================================
-- TABLAS DE AUTENTICACIÓN Y EMPRESAS (MULTIEMPRESA)
-- =====================================================

SET search_path TO auth, public;

-- Tabla de usuarios
CREATE TABLE auth.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'CONTADOR' CHECK (rol IN ('ADMINISTRADOR', 'CONTADOR', 'USUARIO')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de empresas
CREATE TABLE auth.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razon_social VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    nit VARCHAR(20) UNIQUE NOT NULL,
    actividad_economica VARCHAR(50) NOT NULL CHECK (actividad_economica IN (
        'COMERCIAL', 'SERVICIOS', 'TRANSPORTE', 'INDUSTRIAL', 
        'PETROLERA', 'CONSTRUCCION', 'AGROPECUARIA', 'MINERA'
    )),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    ciudad VARCHAR(50) DEFAULT 'La Paz',
    logo TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación usuarios-empresas (MULTIEMPRESA)
CREATE TABLE auth.usuarios_empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.usuarios(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES auth.empresas(id) ON DELETE CASCADE,
    rol_en_empresa VARCHAR(20) DEFAULT 'CONTADOR',
    acceso_total BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, empresa_id)
);

-- Índices para performance
CREATE INDEX idx_usuarios_email ON auth.usuarios(email);
CREATE INDEX idx_empresas_nit ON auth.empresas(nit);
CREATE INDEX idx_usuarios_empresas_usuario ON auth.usuarios_empresas(usuario_id);
CREATE INDEX idx_usuarios_empresas_empresa ON auth.usuarios_empresas(empresa_id);

-- Comentarios
COMMENT ON TABLE auth.usuarios IS 'Usuarios del sistema con acceso a múltiples empresas';
COMMENT ON TABLE auth.empresas IS 'Empresas registradas en el sistema (MULTIEMPRESA)';
COMMENT ON TABLE auth.usuarios_empresas IS 'Relación N:M entre usuarios y empresas';
COMMENT ON COLUMN auth.empresas.actividad_economica IS '8 actividades según PUCT: COMERCIAL, SERVICIOS, TRANSPORTE, INDUSTRIAL, PETROLERA, CONSTRUCCION, AGROPECUARIA, MINERA';
