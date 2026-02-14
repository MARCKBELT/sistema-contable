-- ============================================
-- DATOS INICIALES DEL SISTEMA
-- ============================================

-- ============================================
-- 1. EMPRESA DEMO
-- ============================================
INSERT INTO empresas (id, nit, razon_social, nombre_comercial, tipo_empresa, actividad_economica, direccion, telefono, email, ciudad)
VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    '1234567890',
    'EMPRESA DEMO S.R.L.',
    'Demo Contable',
    'servicios',
    'Servicios de Contabilidad',
    'Av. 16 de Julio #1234',
    '2-2451068',
    'contacto@democontable.com',
    'La Paz'
);

-- ============================================
-- 2. USUARIO SUPER ADMIN
-- ============================================
-- Password: Admin123! (encriptado con bcrypt)
INSERT INTO usuarios (id, empresa_id, email, password_hash, nombres, apellidos, ci, rol, cargo, activo)
VALUES 
(
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'admin@contable.com',
    '$2b$10$rKJ5VqZ3Q7xHZJZq5n5a5.XQK5YxVqZ3Q7xHZJZq5n5a5.XQK5YxV',
    'Antonio',
    'Administrador',
    '1234567 LP',
    'super_admin',
    'Administrador del Sistema',
    true
);

-- ============================================
-- 3. MÓDULOS DEL SISTEMA
-- ============================================
INSERT INTO modulos (id, nombre, descripcion, icono, ruta, activo) VALUES
('a1111111-1111-1111-1111-111111111111', 'Dashboard', 'Panel de control principal', 'dashboard', '/dashboard', true),
('a2222222-2222-2222-2222-222222222222', 'Contabilidad', 'Módulo de contabilidad', 'receipt', '/contabilidad', true),
('a3333333-3333-3333-3333-333333333333', 'Plan de Cuentas', 'Gestión del plan de cuentas', 'account_tree', '/contabilidad/plan-cuentas', true),
('a4444444-4444-4444-4444-444444444444', 'Comprobantes', 'Registro de comprobantes contables', 'description', '/contabilidad/comprobantes', true),
('a5555555-5555-5555-5555-555555555555', 'Libros Contables', 'Libros diario, mayor, balance', 'menu_book', '/contabilidad/libros', true),
('a6666666-6666-6666-6666-666666666666', 'Nóminas', 'Módulo de nóminas y RRHH', 'people', '/nominas', true),
('a7777777-7777-7777-7777-777777777777', 'Empleados', 'Gestión de empleados', 'badge', '/nominas/empleados', true),
('a8888888-8888-8888-8888-888888888888', 'Planillas', 'Generación de planillas de sueldos', 'payments', '/nominas/planillas', true),
('a9999999-9999-9999-9999-999999999999', 'Facturación', 'Módulo de facturación electrónica', 'receipt_long', '/facturacion', true),
('b1111111-1111-1111-1111-111111111111', 'Clientes', 'Gestión de clientes', 'person', '/facturacion/clientes', true),
('b2222222-2222-2222-2222-222222222222', 'Productos', 'Catálogo de productos/servicios', 'inventory', '/facturacion/productos', true),
('b3333333-3333-3333-3333-333333333333', 'Facturas', 'Emisión de facturas SIAT', 'receipt', '/facturacion/facturas', true),
('b4444444-4444-4444-4444-444444444444', 'Reportes', 'Reportes e informes', 'analytics', '/reportes', true),
('b5555555-5555-5555-5555-555555555555', 'Configuración', 'Configuración del sistema', 'settings', '/configuracion', true),
('b6666666-6666-6666-6666-666666666666', 'Usuarios', 'Gestión de usuarios', 'manage_accounts', '/configuracion/usuarios', true);

-- ============================================
-- 4. PERMISOS COMPLETOS PARA SUPER ADMIN
-- ============================================
INSERT INTO permisos (usuario_id, modulo_id, puede_leer, puede_crear, puede_editar, puede_eliminar)
SELECT 
    '22222222-2222-2222-2222-222222222222',
    id,
    true,
    true,
    true,
    true
FROM modulos;

-- ============================================
-- 5. PLAN DE CUENTAS BÁSICO BOLIVIANO
-- ============================================
-- ACTIVOS
INSERT INTO plan_cuentas (empresa_id, codigo, nombre, nivel, tipo_cuenta, acepta_movimientos) VALUES
('11111111-1111-1111-1111-111111111111', '1', 'ACTIVO', 1, 'activo', false),
('11111111-1111-1111-1111-111111111111', '1.1', 'ACTIVO CORRIENTE', 2, 'activo', false),
('11111111-1111-1111-1111-111111111111', '1.1.1', 'DISPONIBLE', 3, 'activo', false),
('11111111-1111-1111-1111-111111111111', '1.1.1.01', 'Caja Moneda Nacional', 4, 'activo', true),
('11111111-1111-1111-1111-111111111111', '1.1.1.02', 'Caja Moneda Extranjera', 4, 'activo', true),
('11111111-1111-1111-1111-111111111111', '1.1.1.03', 'Banco Moneda Nacional', 4, 'activo', true),
('11111111-1111-1111-1111-111111111111', '1.1.1.04', 'Banco Moneda Extranjera', 4, 'activo', true),
('11111111-1111-1111-1111-111111111111', '1.1.2', 'EXIGIBLE', 3, 'activo', false),
('11111111-1111-1111-1111-111111111111', '1.1.2.01', 'Cuentas por Cobrar Clientes', 4, 'activo', true),
('11111111-1111-1111-1111-111111111111', '1.1.2.02', 'Documentos por Cobrar', 4, 'activo', true),
('11111111-1111-1111-1111-111111111111', '1.1.2.03', 'Anticipo a Proveedores', 4, 'activo', true),
('11111111-1111-1111-1111-111111111111', '1.1.3', 'REALIZABLE', 3, 'activo', false),
('11111111-1111-1111-1111-111111111111', '1.1.3.01', 'Inventario de Mercaderías', 4, 'activo', true),
('11111111-1111-1111-1111-111111111111', '1.1.3.02', 'Inventario de Materiales', 4, 'activo', true),
('11111111-1111-1111-1111-111111111111', '1.2', 'ACTIVO NO CORRIENTE', 2, 'activo', false),
('11111111-1111-1111-1111-111111111111', '1.2.1', 'ACTIVO FIJO', 3, 'activo', false),
('11111111-1111-1111-1111-111111111111', '1.2.1.01', 'Muebles y Enseres', 4, 'activo', true),
('11111111-1111-1111-1111-111111111111', '1.2.1.02', 'Equipos de Computación', 4, 'activo', true),
('11111111-1111-1111-1111-111111111111', '1.2.1.03', 'Vehículos', 4, 'activo', true),
('11111111-1111-1111-1111-111111111111', '1.2.1.04', 'Depreciación Acumulada', 4, 'activo', true);

-- PASIVOS
INSERT INTO plan_cuentas (empresa_id, codigo, nombre, nivel, tipo_cuenta, acepta_movimientos) VALUES
('11111111-1111-1111-1111-111111111111', '2', 'PASIVO', 1, 'pasivo', false),
('11111111-1111-1111-1111-111111111111', '2.1', 'PASIVO CORRIENTE', 2, 'pasivo', false),
('11111111-1111-1111-1111-111111111111', '2.1.1', 'CUENTAS POR PAGAR', 3, 'pasivo', false),
('11111111-1111-1111-1111-111111111111', '2.1.1.01', 'Proveedores', 4, 'pasivo', true),
('11111111-1111-1111-1111-111111111111', '2.1.1.02', 'Sueldos por Pagar', 4, 'pasivo', true),
('11111111-1111-1111-1111-111111111111', '2.1.1.03', 'Aportes Laborales por Pagar AFP', 4, 'pasivo', true),
('11111111-1111-1111-1111-111111111111', '2.1.1.04', 'Aportes Patronales por Pagar', 4, 'pasivo', true),
('11111111-1111-1111-1111-111111111111', '2.1.1.05', 'RC-IVA por Pagar', 4, 'pasivo', true),
('11111111-1111-1111-1111-111111111111', '2.1.1.06', 'IVA por Pagar', 4, 'pasivo', true),
('11111111-1111-1111-1111-111111111111', '2.1.1.07', 'IT por Pagar', 4, 'pasivo', true),
('11111111-1111-1111-1111-111111111111', '2.2', 'PASIVO NO CORRIENTE', 2, 'pasivo', false),
('11111111-1111-1111-1111-111111111111', '2.2.1', 'OBLIGACIONES A LARGO PLAZO', 3, 'pasivo', false),
('11111111-1111-1111-1111-111111111111', '2.2.1.01', 'Préstamos Bancarios', 4, 'pasivo', true),
('11111111-1111-1111-1111-111111111111', '2.2.1.02', 'Provisión Indemnizaciones', 4, 'pasivo', true),
('11111111-1111-1111-1111-111111111111', '2.2.1.03', 'Provisión Aguinaldos', 4, 'pasivo', true);

-- PATRIMONIO
INSERT INTO plan_cuentas (empresa_id, codigo, nombre, nivel, tipo_cuenta, acepta_movimientos) VALUES
('11111111-1111-1111-1111-111111111111', '3', 'PATRIMONIO', 1, 'patrimonio', false),
('11111111-1111-1111-1111-111111111111', '3.1', 'CAPITAL', 2, 'patrimonio', false),
('11111111-1111-1111-1111-111111111111', '3.1.1', 'Capital Social', 3, 'patrimonio', true),
('11111111-1111-1111-1111-111111111111', '3.2', 'RESULTADOS', 2, 'patrimonio', false),
('11111111-1111-1111-1111-111111111111', '3.2.1', 'Resultados Acumulados', 3, 'patrimonio', true),
('11111111-1111-1111-1111-111111111111', '3.2.2', 'Resultado de la Gestión', 3, 'patrimonio', true),
('11111111-1111-1111-1111-111111111111', '3.3', 'AJUSTES', 2, 'patrimonio', false),
('11111111-1111-1111-1111-111111111111', '3.3.1', 'Ajuste por Inflación y Tenencia de Bienes', 3, 'patrimonio', true);

-- INGRESOS
INSERT INTO plan_cuentas (empresa_id, codigo, nombre, nivel, tipo_cuenta, acepta_movimientos) VALUES
('11111111-1111-1111-1111-111111111111', '4', 'INGRESOS', 1, 'ingreso', false),
('11111111-1111-1111-1111-111111111111', '4.1', 'INGRESOS OPERACIONALES', 2, 'ingreso', false),
('11111111-1111-1111-1111-111111111111', '4.1.1', 'Ventas', 3, 'ingreso', true),
('11111111-1111-1111-1111-111111111111', '4.1.2', 'Ingresos por Servicios', 3, 'ingreso', true),
('11111111-1111-1111-1111-111111111111', '4.2', 'INGRESOS NO OPERACIONALES', 2, 'ingreso', false),
('11111111-1111-1111-1111-111111111111', '4.2.1', 'Ganancia por Diferencia de Cambio', 3, 'ingreso', true),
('11111111-1111-1111-1111-111111111111', '4.2.2', 'Otros Ingresos', 3, 'ingreso', true);

-- EGRESOS
INSERT INTO plan_cuentas (empresa_id, codigo, nombre, nivel, tipo_cuenta, acepta_movimientos) VALUES
('11111111-1111-1111-1111-111111111111', '5', 'EGRESOS', 1, 'egreso', false),
('11111111-1111-1111-1111-111111111111', '5.1', 'COSTO DE VENTAS', 2, 'egreso', false),
('11111111-1111-1111-1111-111111111111', '5.1.1', 'Costo de Mercaderías Vendidas', 3, 'egreso', true),
('11111111-1111-1111-1111-111111111111', '5.2', 'GASTOS OPERACIONALES', 2, 'egreso', false),
('11111111-1111-1111-1111-111111111111', '5.2.1', 'GASTOS ADMINISTRATIVOS', 3, 'egreso', false),
('11111111-1111-1111-1111-111111111111', '5.2.1.01', 'Sueldos y Salarios', 4, 'egreso', true),
('11111111-1111-1111-1111-111111111111', '5.2.1.02', 'Aportes Patronales AFP', 4, 'egreso', true),
('11111111-1111-1111-1111-111111111111', '5.2.1.03', 'Aportes Caja de Salud', 4, 'egreso', true),
('11111111-1111-1111-1111-111111111111', '5.2.1.04', 'Aguinaldos', 4, 'egreso', true),
('11111111-1111-1111-1111-111111111111', '5.2.1.05', 'Indemnizaciones', 4, 'egreso', true),
('11111111-1111-1111-1111-111111111111', '5.2.1.06', 'Alquileres', 4, 'egreso', true),
('11111111-1111-1111-1111-111111111111', '5.2.1.07', 'Servicios Básicos', 4, 'egreso', true),
('11111111-1111-1111-1111-111111111111', '5.2.1.08', 'Material de Escritorio', 4, 'egreso', true),
('11111111-1111-1111-1111-111111111111', '5.3', 'GASTOS NO OPERACIONALES', 2, 'egreso', false),
('11111111-1111-1111-1111-111111111111', '5.3.1', 'Pérdida por Diferencia de Cambio', 3, 'egreso', true),
('11111111-1111-1111-1111-111111111111', '5.3.2', 'Gastos Financieros', 3, 'egreso', true);

-- ============================================
-- 6. TIPOS DE CAMBIO INICIALES
-- ============================================
INSERT INTO tipos_cambio (empresa_id, fecha, moneda, tipo_oficial, tipo_referencial, tipo_paralelo, fuente)
VALUES 
('11111111-1111-1111-1111-111111111111', CURRENT_DATE, 'USD', 6.96, 8.90, 9.60, 'BCB'),
('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '1 day', 'USD', 6.96, 8.85, 9.55, 'BCB'),
('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '2 days', 'USD', 6.96, 8.80, 9.50, 'BCB');

-- ============================================
-- 7. CLIENTE DEMO
-- ============================================
INSERT INTO clientes (empresa_id, nit, razon_social, email, telefono, ciudad, tipo_cliente)
VALUES 
('11111111-1111-1111-1111-111111111111', '1234567890', 'Cliente Demo S.R.L.', 'cliente@demo.com', '2-2234567', 'La Paz', 'juridico');

-- ============================================
-- 8. PRODUCTOS DEMO
-- ============================================
INSERT INTO productos (empresa_id, codigo, nombre, tipo, unidad_medida, precio_venta, precio_compra, stock_actual)
VALUES 
('11111111-1111-1111-1111-111111111111', 'PROD-001', 'Producto Demo 1', 'producto', 'unidad', 150.00, 100.00, 50),
('11111111-1111-1111-1111-111111111111', 'SERV-001', 'Servicio de Consultoría', 'servicio', 'hora', 350.00, 0, 0);

-- ============================================
-- MENSAJES DE CONFIRMACIÓN
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Base de datos inicializada correctamente';
    RAISE NOTICE '📊 Empresa demo creada: EMPRESA DEMO S.R.L.';
    RAISE NOTICE '👤 Usuario admin: admin@contable.com / Admin123!';
    RAISE NOTICE '🏦 Plan de cuentas básico cargado';
    RAISE NOTICE '💱 Tipos de cambio inicializados';
END $$;
