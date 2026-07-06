-- ============================================================
-- MÓDULO: Solicitudes de Desarrollo
-- BASE DE DATOS: PostgreSQL
-- VERSIÓN: 2.0 - Con cargo_impactado
-- ============================================================

-- ============================================================
-- 1. TABLAS CATÁLOGO
-- ============================================================

-- 1.1 Tipo de solicitud
CREATE TABLE IF NOT EXISTS sd_tipo_solicitud (
    id         BIGSERIAL    PRIMARY KEY,
    codigo     VARCHAR(20)  NOT NULL UNIQUE,
    nombre     VARCHAR(100) NOT NULL,
    activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

INSERT INTO sd_tipo_solicitud (codigo, nombre) VALUES
('PROYECTO', 'Proyecto'),
('MEJORA',   'Mejora')
ON CONFLICT (codigo) DO NOTHING;

-- 1.2 Estado de solicitud
CREATE TABLE IF NOT EXISTS sd_estado_solicitud (
    id          BIGSERIAL    PRIMARY KEY,
    codigo      VARCHAR(30)  NOT NULL UNIQUE,
    nombre      VARCHAR(50)  NOT NULL,
    color       VARCHAR(20),
    fase        INTEGER      NOT NULL DEFAULT 1,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

INSERT INTO sd_estado_solicitud (codigo, nombre, color, fase) VALUES
('BORRADOR',                  'Borrador',                 '#6c757d', 1),
('ENVIADA',                   'Enviada',                  '#17a2b8', 1),
('EN_DOCUMENTACION',          'En documentación',         '#ffc107', 2),
('EN_PRUEBAS_FUNCIONALES',    'En pruebas funcionales',   '#fd7e14', 3),
('EN_DESARROLLO',             'En desarrollo',            '#007bff', 4),
('EN_PRUEBAS_ACEPTACION',     'En pruebas de aceptación', '#6610f2', 4),
('CERRADA',                   'Cerrada',                  '#28a745', 5),
('RECHAZADA',                 'Rechazada',                '#dc3545', 5)
ON CONFLICT (codigo) DO NOTHING;

-- 1.3 Requisitos de seguridad
CREATE TABLE IF NOT EXISTS sd_requisito_seguridad (
    id          BIGSERIAL    PRIMARY KEY,
    codigo      VARCHAR(20)  NOT NULL UNIQUE,
    descripcion TEXT         NOT NULL,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

INSERT INTO sd_requisito_seguridad (codigo, descripcion) VALUES
('AUT-01', 'Autentificar adecuadamente: La información confidencial y los sistemas informáticos sólo deben ser accesibles por las personas con los roles y permisos definidos.'),
('OCU-01', 'No utilizar campos ocultos para almacenar información sensible, porque esto permitiría que se exponga datos e información del funcionamiento interno de los aplicativos.'),
('COM-01', 'Comprobar las entradas: Es necesario que se verifique y controle los datos que son introducidos en los aplicativos.'),
('VAL-01', 'Valores límite de salida: Aquí se debe controlar la salida de los métodos, que el dato resultante de una operación esté dentro de los parámetros definidos antes de asignarlo.'),
('FOR-01', 'Formato de salida: Los formatos de salida no deben ser combinados por funciones debido a que estos pueden ocasionar errores asociados con el manejo del buffer.'),
('SEG-01', 'Asegurar que los métodos que llevan a cabo controles de seguridad sean declarados como privados o finales, prohibiendo la extensión de los mismos.'),
('DAT-01', 'Evitar el uso de datos reales de carácter personal en las pruebas anteriores a la implantación o modificación de un sistema.')
ON CONFLICT (codigo) DO NOTHING;


-- ============================================================
-- 2. TABLA PRINCIPAL: SOLICITUD
-- ============================================================

CREATE TABLE IF NOT EXISTS sd_solicitud (
    id                    BIGSERIAL    PRIMARY KEY,
    codigo                VARCHAR(20)  NOT NULL UNIQUE,
    fecha_creacion        DATE         NOT NULL DEFAULT CURRENT_DATE,
    empleado_documento    VARCHAR(20)  NOT NULL,
    empleado_nombre       VARCHAR(200) NOT NULL,
    empleado_correo       VARCHAR(150) NOT NULL,
    empleado_cargo        VARCHAR(150) NOT NULL,
    empleado_sede         VARCHAR(100) NOT NULL,
    solicitud_proceso     VARCHAR(500) NOT NULL,
    proceso_id            BIGINT       NOT NULL,
    area_id               BIGINT       NOT NULL,
    macroproceso_id       BIGINT       NOT NULL,
    tipo_solicitud_id     BIGINT       NOT NULL REFERENCES sd_tipo_solicitud(id),
    estado_id             BIGINT       NOT NULL REFERENCES sd_estado_solicitud(id) DEFAULT 1,
    prioridad             VARCHAR(20)  NOT NULL DEFAULT 'media',
    observaciones         TEXT,
    impacto               TEXT         NOT NULL,
    pdf_nombre            VARCHAR(255),
    pdf_contenido         BYTEA,
    usuario_registro      VARCHAR(100) NOT NULL,
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sd_sol_codigo             ON sd_solicitud(codigo);
CREATE INDEX IF NOT EXISTS idx_sd_sol_empleado_documento ON sd_solicitud(empleado_documento);
CREATE INDEX IF NOT EXISTS idx_sd_sol_proceso_id         ON sd_solicitud(proceso_id);
CREATE INDEX IF NOT EXISTS idx_sd_sol_area_id            ON sd_solicitud(area_id);
CREATE INDEX IF NOT EXISTS idx_sd_sol_macroproceso_id    ON sd_solicitud(macroproceso_id);
CREATE INDEX IF NOT EXISTS idx_sd_sol_tipo_solicitud_id  ON sd_solicitud(tipo_solicitud_id);
CREATE INDEX IF NOT EXISTS idx_sd_sol_estado_id          ON sd_solicitud(estado_id);
CREATE INDEX IF NOT EXISTS idx_sd_sol_fecha_creacion     ON sd_solicitud(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_sd_sol_usuario_registro   ON sd_solicitud(usuario_registro);


-- ============================================================
-- 3. TABLA: REQUERIMIENTO (CON cargo_impactado)
-- ============================================================

CREATE TABLE IF NOT EXISTS sd_requerimiento (
    id                 BIGSERIAL    PRIMARY KEY,
    solicitud_id       BIGINT       NOT NULL REFERENCES sd_solicitud(id) ON DELETE CASCADE,
    numero_orden       INTEGER      NOT NULL,
    codigo             VARCHAR(10)  NOT NULL,
    tipo_requerimiento SMALLINT     NOT NULL,
    objetivo           VARCHAR(200) NOT NULL,
    detalle            TEXT         NOT NULL,  //varchar 20000
    
    -- ============================================================
    -- ✅ NUEVO CAMPO: cargo_impactado
    -- ============================================================
    cargo_impactado    VARCHAR(100),
    
    fecha_ingreso      DATE         NOT NULL DEFAULT CURRENT_DATE,
    estado_id          BIGINT       REFERENCES sd_estado_solicitud(id) DEFAULT 1,
    usuario_registro   VARCHAR(100) NOT NULL,
    created_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_req_orden  UNIQUE (solicitud_id, tipo_requerimiento, numero_orden),
    CONSTRAINT uq_req_codigo UNIQUE (solicitud_id, tipo_requerimiento, codigo),
    CONSTRAINT chk_tipo_req  CHECK (tipo_requerimiento IN (0, 1)),
    CONSTRAINT chk_req_codigo CHECK (codigo ~ '^(RF|RNF)_[0-9]+$')
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sd_req_solicitud ON sd_requerimiento(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_sd_req_tipo      ON sd_requerimiento(tipo_requerimiento);
CREATE INDEX IF NOT EXISTS idx_sd_req_orden     ON sd_requerimiento(solicitud_id, tipo_requerimiento, numero_orden);
CREATE INDEX IF NOT EXISTS idx_sd_req_estado    ON sd_requerimiento(estado_id);


-- ============================================================
-- 4. TABLA: REQUERIMIENTO - CARGOS
-- ============================================================

CREATE TABLE IF NOT EXISTS sd_requerimiento_cargo (
    requerimiento_id BIGINT NOT NULL REFERENCES sd_requerimiento(id) ON DELETE CASCADE,
    cargo_id         BIGINT NOT NULL,  -- ID en Oracle
    PRIMARY KEY (requerimiento_id, cargo_id)
);

CREATE INDEX IF NOT EXISTS idx_sd_reqc_req ON sd_requerimiento_cargo(requerimiento_id);
CREATE INDEX IF NOT EXISTS idx_sd_reqc_c   ON sd_requerimiento_cargo(cargo_id);


-- ============================================================
-- 5. TABLA: REQUERIMIENTO - IMÁGENES
-- ============================================================

CREATE TABLE IF NOT EXISTS sd_requerimiento_imagen (
    id               BIGSERIAL    PRIMARY KEY,
    requerimiento_id BIGINT       NOT NULL REFERENCES sd_requerimiento(id) ON DELETE CASCADE,
    nombre_archivo   VARCHAR(255) NOT NULL,
    tipo_contenido   VARCHAR(100) NOT NULL,
    contenido        BYTEA        NOT NULL,
    usuario_registro VARCHAR(100) NOT NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_tipo_contenido CHECK (tipo_contenido IN (
        'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'
    ))
);

CREATE INDEX IF NOT EXISTS idx_sd_reqi_req ON sd_requerimiento_imagen(requerimiento_id);


-- ============================================================
-- 6. TABLA: SOLICITUD - REQUISITOS SEGURIDAD
-- ============================================================

CREATE TABLE IF NOT EXISTS sd_solicitud_requisito_seguridad (
    solicitud_id           BIGINT NOT NULL REFERENCES sd_solicitud(id) ON DELETE CASCADE,
    requisito_seguridad_id BIGINT NOT NULL REFERENCES sd_requisito_seguridad(id),
    PRIMARY KEY (solicitud_id, requisito_seguridad_id)
);

CREATE INDEX IF NOT EXISTS idx_sd_srs_solicitud ON sd_solicitud_requisito_seguridad(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_sd_srs_requisito ON sd_solicitud_requisito_seguridad(requisito_seguridad_id);


-- ============================================================
-- 7. TABLA: AUDITORÍA
-- ============================================================

CREATE TABLE IF NOT EXISTS sd_auditoria (
    id                 BIGSERIAL    PRIMARY KEY,
    solicitud_id       BIGINT       NOT NULL REFERENCES sd_solicitud(id) ON DELETE CASCADE,
    estado_anterior_id BIGINT       REFERENCES sd_estado_solicitud(id),
    estado_nuevo_id    BIGINT       NOT NULL REFERENCES sd_estado_solicitud(id),
    observacion        TEXT,  // Observación del cambio de estado VARCHAR 20000
    fase               INTEGER      NOT NULL DEFAULT 1,
    usuario_registro   VARCHAR(100) NOT NULL,
    created_at         TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sd_aud_solicitud  ON sd_auditoria(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_sd_aud_created_at ON sd_auditoria(created_at);
CREATE INDEX IF NOT EXISTS idx_sd_aud_fase       ON sd_auditoria(fase);
CREATE INDEX IF NOT EXISTS idx_sd_aud_estado_ant ON sd_auditoria(estado_anterior_id);
CREATE INDEX IF NOT EXISTS idx_sd_aud_estado_nue ON sd_auditoria(estado_nuevo_id);


-- ============================================================
-- 8. TABLA: NOTIFICACIONES
-- ============================================================

CREATE TABLE IF NOT EXISTS sd_notificacion (
    id               BIGSERIAL    PRIMARY KEY,
    solicitud_id     BIGINT       NOT NULL REFERENCES sd_solicitud(id) ON DELETE CASCADE,
    destinatario     VARCHAR(150) NOT NULL,
    tipo             VARCHAR(20)  NOT NULL,
    asunto           VARCHAR(200) NOT NULL,
    contenido        TEXT         NOT NULL,
    enviado          BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_envio      TIMESTAMP,
    usuario_registro VARCHAR(100) NOT NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sd_not_solicitud      ON sd_notificacion(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_sd_not_destinatario   ON sd_notificacion(destinatario);
CREATE INDEX IF NOT EXISTS idx_sd_not_enviado        ON sd_notificacion(enviado);
CREATE INDEX IF NOT EXISTS idx_sd_not_tipo           ON sd_notificacion(tipo);


-- ============================================================
-- 9. FUNCIONES Y TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_solicitud_updated_at
    BEFORE UPDATE ON sd_solicitud
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_requerimiento_updated_at
    BEFORE UPDATE ON sd_requerimiento
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- 10. VISTA DE RESUMEN
-- ============================================================

CREATE OR REPLACE VIEW sd_vista_resumen_solicitudes AS
SELECT
    s.id,
    s.codigo,
    s.fecha_creacion,
    s.empleado_documento,
    s.empleado_nombre,
    s.empleado_correo,
    s.empleado_cargo,
    s.empleado_sede,
    s.solicitud_proceso,
    s.prioridad,
    s.impacto,
    s.observaciones,
    s.estado_id,
    e.codigo AS estado_codigo,
    e.nombre AS estado_nombre,
    e.color AS estado_color,
    e.fase AS estado_fase,
    s.tipo_solicitud_id,
    t.codigo AS tipo_codigo,
    t.nombre AS tipo_nombre,
    s.proceso_id,
    s.area_id,
    s.macroproceso_id,
    s.usuario_registro,
    s.created_at,
    s.updated_at,
    (SELECT COUNT(*) FROM sd_requerimiento r WHERE r.solicitud_id = s.id) AS total_requerimientos,
    (SELECT COUNT(*) FROM sd_requerimiento r WHERE r.solicitud_id = s.id AND r.tipo_requerimiento = 0) AS req_funcionales,
    (SELECT COUNT(*) FROM sd_requerimiento r WHERE r.solicitud_id = s.id AND r.tipo_requerimiento = 1) AS req_no_funcionales
FROM
    sd_solicitud s
    LEFT JOIN sd_estado_solicitud e ON s.estado_id = e.id
    LEFT JOIN sd_tipo_solicitud t ON s.tipo_solicitud_id = t.id
WHERE
    s.estado_id NOT IN (7, 8)
ORDER BY
    s.fecha_creacion DESC;


-- ============================================================
-- 11. VERIFICACIÓN
-- ============================================================

SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) AS column_count
FROM
    information_schema.tables t
WHERE
    table_schema = 'public'
    AND table_name LIKE 'sd_%'
ORDER BY
    table_name;


-- ============================================================
-- RESUMEN DE TABLAS:
--   1. sd_tipo_solicitud
--   2. sd_estado_solicitud
--   3. sd_requisito_seguridad
--   4. sd_solicitud
--   5. sd_requerimiento (con cargo_impactado)
--   6. sd_requerimiento_cargo
--   7. sd_requerimiento_imagen
--   8. sd_solicitud_requisito_seguridad
--   9. sd_auditoria
--  10. sd_notificacion
--  11. sd_vista_resumen_solicitudes (vista)
-- ============================================================

-- ============================================================
-- 12. MIGRACIÓN: columna prioridad (bases de datos existentes)
-- Ejecutar solo si la tabla ya existía sin este campo.
-- ============================================================
ALTER TABLE sd_solicitud
    ADD COLUMN IF NOT EXISTS prioridad VARCHAR(20) NOT NULL DEFAULT 'media';

ALTER TABLE sd_solicitud
    ADD COLUMN IF NOT EXISTS empleado_sede VARCHAR(100);

-- Recrear la vista para incluir prioridad y empleado_sede
CREATE OR REPLACE VIEW sd_vista_resumen_solicitudes AS
SELECT
    s.id,
    s.codigo,
    s.fecha_creacion,
    s.empleado_documento,
    s.empleado_nombre,
    s.empleado_correo,
    s.empleado_cargo,
    s.empleado_sede,
    s.solicitud_proceso,
    s.prioridad,
    s.impacto,
    s.observaciones,
    s.estado_id,
    e.codigo AS estado_codigo,
    e.nombre AS estado_nombre,
    e.color AS estado_color,
    e.fase AS estado_fase,
    s.tipo_solicitud_id,
    t.codigo AS tipo_codigo,
    t.nombre AS tipo_nombre,
    s.proceso_id,
    s.area_id,
    s.macroproceso_id,
    s.usuario_registro,
    s.created_at,
    s.updated_at,
    (SELECT COUNT(*) FROM sd_requerimiento r WHERE r.solicitud_id = s.id) AS total_requerimientos,
    (SELECT COUNT(*) FROM sd_requerimiento r WHERE r.solicitud_id = s.id AND r.tipo_requerimiento = 0) AS req_funcionales,
    (SELECT COUNT(*) FROM sd_requerimiento r WHERE r.solicitud_id = s.id AND r.tipo_requerimiento = 1) AS req_no_funcionales
FROM
    sd_solicitud s
    LEFT JOIN sd_estado_solicitud e ON s.estado_id = e.id
    LEFT JOIN sd_tipo_solicitud t ON s.tipo_solicitud_id = t.id
WHERE
    s.estado_id NOT IN (7, 8)
ORDER BY
    s.fecha_creacion DESC;