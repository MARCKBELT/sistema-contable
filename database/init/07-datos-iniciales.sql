-- =====================================================
-- DATOS INICIALES (CORREGIDOS)
-- =====================================================

SET search_path TO auth, shared, public;

-- IMPORTANTE: Primero eliminamos si existen (para re-ejecución)
DELETE FROM auth.usuarios_empresas WHERE usuario_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM auth.usuarios WHERE id = '11111111-1111-1111-1111-111111111111';
DELETE FROM auth.empresas WHERE id = '22222222-2222-2222-2222-222222222222';

-- Usuario administrador (contraseña se creará dinámicamente)
-- La contraseña Admin2026! debe setearse después con bcrypt
INSERT INTO auth.usuarios (id, nombre, email, password, rol) VALUES
('11111111-1111-1111-1111-111111111111', 'Administrador Sistema', 'admin@contable.bo', 
 'TEMPORAL', 'ADMINISTRADOR');

-- Empresa de demostración
INSERT INTO auth.empresas (id, razon_social, nombre_comercial, nit, actividad_economica, ciudad) VALUES
('22222222-2222-2222-2222-222222222222', 'EMPRESA DEMO S.A.', 'Demo', '1234567890', 'COMERCIAL', 'La Paz');

-- Relación usuario-empresa
INSERT INTO auth.usuarios_empresas (usuario_id, empresa_id, rol_en_empresa, acceso_total) VALUES
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'ADMINISTRADOR', true);

-- Parámetros del sistema (16 parámetros)
INSERT INTO shared.parametros_sistema (nombre, valor, categoria, tipo_dato, descripcion) VALUES
('SALARIO_MINIMO_NACIONAL', '3300.00', 'SALARIAL', 'decimal', 'Salario Mínimo Nacional en Bolivianos'),
('TIPO_CAMBIO_USD_BOB', '6.96', 'CAMBIARIA', 'decimal', 'Tipo de Cambio USD a BOB'),
('UFV_ACTUAL', '2.58347', 'UFV', 'decimal', 'Unidad de Fomento a la Vivienda actual'),
('ALICUOTA_RC_IVA', '13', 'IMPUESTOS', 'integer', 'Alícuota RC-IVA (Dependientes) en %'),
('ALICUOTA_IT', '3', 'IMPUESTOS', 'integer', 'Alícuota IT en %'),
('ALICUOTA_IVA', '13', 'IMPUESTOS', 'integer', 'Alícuota IVA en %'),
('ALICUOTA_IUE', '25', 'IMPUESTOS', 'integer', 'Alícuota IUE en %'),
('AFP_APORTE_LABORAL', '12.71', 'APORTES', 'decimal', 'AFP Aporte Laboral en %'),
('AFP_APORTE_PATRONAL', '3', 'APORTES', 'decimal', 'AFP Aporte Patronal en %'),
('CAJA_SALUD_LABORAL', '10', 'APORTES', 'decimal', 'Caja de Salud Laboral en %'),
('CAJA_SALUD_PATRONAL', '10', 'APORTES', 'decimal', 'Caja de Salud Patronal en %'),
('AGUINALDO_MESES', '1', 'BENEFICIOS', 'integer', 'Aguinaldo en meses'),
('INDEMNIZACION_ANIO', '1', 'BENEFICIOS', 'integer', 'Indemnización por año trabajado'),
('REDONDEO_DECIMALES', '2', 'SISTEMA', 'integer', 'Decimales para redondeo'),
('FORMATO_FECHA', 'DD/MM/YYYY', 'SISTEMA', 'text', 'Formato de fecha del sistema'),
('MONEDA_BASE', 'BOB', 'SISTEMA', 'text', 'Moneda base del sistema');

-- UFV histórico (últimos 30 días)
INSERT INTO shared.ufv_historico (fecha, valor, fuente) VALUES
('2026-01-22', 2.58100, 'BCB'),
('2026-01-23', 2.58120, 'BCB'),
('2026-01-24', 2.58140, 'BCB'),
('2026-01-27', 2.58160, 'BCB'),
('2026-01-28', 2.58180, 'BCB'),
('2026-01-29', 2.58200, 'BCB'),
('2026-01-30', 2.58220, 'BCB'),
('2026-01-31', 2.58240, 'BCB'),
('2026-02-03', 2.58260, 'BCB'),
('2026-02-04', 2.58280, 'BCB'),
('2026-02-05', 2.58300, 'BCB'),
('2026-02-06', 2.58320, 'BCB'),
('2026-02-10', 2.58340, 'BCB'),
('2026-02-21', 2.58347, 'BCB');

COMMENT ON DATABASE contable_db IS 'Sistema Contable Bolivia v1.1 - MULTIEMPRESA';

-- Nota: La contraseña del admin debe actualizarse después con:
-- UPDATE auth.usuarios SET password = <hash_bcrypt> WHERE email = 'admin@contable.bo';
