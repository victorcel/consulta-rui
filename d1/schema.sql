CREATE TABLE IF NOT EXISTS consultas (
  tipo_documento TEXT NOT NULL,
  numero_identificacion TEXT NOT NULL,
  conteo INTEGER NOT NULL DEFAULT 1,
  fecha_ultima_consulta TEXT NOT NULL,
  PRIMARY KEY (tipo_documento, numero_identificacion)
);
