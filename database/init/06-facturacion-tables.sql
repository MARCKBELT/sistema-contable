-- =====================================================
-- TABLAS DE FACTURACIÓN (MULTIEMPRESA)
-- =====================================================

SET search_path TO facturacion, auth, public;

-- Tabla de clientes
CREATE TABLE facturacion.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES auth.empresas(id) ON DELETE CASCADE,
    nit_ci VARCHAR(20) NOT NULL,
    razon_social VARCHAR(200) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, nit_ci)
);

-- Tabla de productos/servicios
CREATE TABLE facturacion.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES auth.empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    unidad_medida VARCHAR(20),
    precio_unitario DECIMAL(10,2) NOT NULL,
    control_stock BOOLEAN DEFAULT false,
    stock_actual INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, codigo)
);

-- Tabla de facturas
CREATE TABLE facturacion.facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES auth.empresas(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    cliente_id UUID NOT NULL REFERENCES facturacion.clientes(id),
    fecha DATE NOT NULL,
    tipo VARCHAR(20) DEFAULT 'MANUAL' CHECK (tipo IN ('MANUAL', 'ELECTRONICA', 'EXPORTACION')),
    subtotal DECIMAL(15,2) NOT NULL,
    iva DECIMAL(15,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'EMITIDA' CHECK (estado IN ('EMITIDA', 'ANULADA', 'PAGADA')),
    fecha_anulacion TIMESTAMP,
    motivo_anulacion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, numero)
);

-- Tabla de detalle de facturas
CREATE TABLE facturacion.detalle_facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id UUID NOT NULL REFERENCES facturacion.facturas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES facturacion.productos(id),
    descripcion VARCHAR(200) NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- Índices
CREATE INDEX idx_clientes_empresa ON facturacion.clientes(empresa_id);
CREATE INDEX idx_productos_empresa ON facturacion.productos(empresa_id);
CREATE INDEX idx_facturas_empresa ON facturacion.facturas(empresa_id);
CREATE INDEX idx_facturas_fecha ON facturacion.facturas(empresa_id, fecha);

-- Comentarios
COMMENT ON TABLE facturacion.clientes IS 'Clientes por empresa';
COMMENT ON TABLE facturacion.productos IS 'Catálogo de productos/servicios por empresa';
COMMENT ON TABLE facturacion.facturas IS 'Facturas emitidas por empresa';
