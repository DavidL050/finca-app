import * as SQLite from 'expo-sqlite';

let dbInstance = null;

export async function getDb() {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('finca.db');
  return dbInstance;
}

const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS fincas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  creado_en TEXT NOT NULL,
  sincronizado INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS hierros (
  id TEXT PRIMARY KEY,
  finca_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  creado_en TEXT NOT NULL,
  sincronizado INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS animales (
  id TEXT PRIMARY KEY,
  finca_id TEXT NOT NULL,
  numero TEXT NOT NULL,
  nombre TEXT,
  hierro_id TEXT,
  raza TEXT,
  foto_uri TEXT,
  activo INTEGER DEFAULT 1,
  creado_en TEXT NOT NULL,
  actualizado_en TEXT NOT NULL,
  sincronizado INTEGER DEFAULT 0,
  estado TEXT DEFAULT 'activo'
);
CREATE INDEX IF NOT EXISTS idx_animales_numero ON animales(numero);
CREATE INDEX IF NOT EXISTS idx_animales_finca ON animales(finca_id);

CREATE TABLE IF NOT EXISTS eventos (
  id TEXT PRIMARY KEY,
  animal_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  fecha TEXT NOT NULL,
  nota TEXT,
  lat REAL,
  lng REAL,
  creado_en TEXT NOT NULL,
  sincronizado INTEGER DEFAULT 0,
  usuario_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_eventos_animal ON eventos(animal_id);
CREATE INDEX IF NOT EXISTS idx_eventos_sync ON eventos(sincronizado);

CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  tabla TEXT NOT NULL,
  registro_id TEXT NOT NULL,
  operacion TEXT NOT NULL,
  payload TEXT NOT NULL,
  intentos INTEGER DEFAULT 0,
  creado_en TEXT NOT NULL,
  ultimo_intento TEXT
);
`;

export async function initDb() {
  const db = await getDb();
  await db.execAsync(SCHEMA_SQL);
  const columnas = await db.getAllAsync(`PRAGMA table_info(animales)`);
  const existentes = new Set(columnas.map((columna) => columna.name));
  const nuevas = [
    ["sexo", "TEXT"],
    ["peso_nacimiento", "REAL"],
    ["madre_id", "TEXT"],
    ["fecha_nacimiento", "TEXT"],
    ["estado", "TEXT DEFAULT 'activo'"],
    ["nombre", "TEXT"],
  ];
  for (const [nombre, tipo] of nuevas) {
    if (!existentes.has(nombre)) {
      await db.execAsync(`ALTER TABLE animales ADD COLUMN ${nombre} ${tipo}`);
    }
  }
  const columnasEventos = await db.getAllAsync(`PRAGMA table_info(eventos)`);
  const eventosExistentes = new Set(columnasEventos.map((columna) => columna.name));
  for (const [nombre, tipo] of [["diagnostico", "TEXT"], ["tratamiento", "TEXT"], ["comprador", "TEXT"], ["vendedor", "TEXT"], ["valor", "REAL"], ["peso_venta", "REAL"], ["evento_padre_id", "TEXT"], ["resuelto_en", "TEXT"]]) {
    if (!eventosExistentes.has(nombre)) await db.execAsync(`ALTER TABLE eventos ADD COLUMN ${nombre} ${tipo}`);
  }
  if (!existentes.has("estado")) {
    await db.execAsync(`UPDATE animales SET estado = CASE WHEN activo = 1 THEN 'activo' ELSE 'vendido' END`);
  } else {
    await db.execAsync(`UPDATE animales SET estado = CASE WHEN activo = 1 THEN 'activo' ELSE 'vendido' END WHERE estado IS NULL OR estado = ''`);
  }
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_animales_madre ON animales(madre_id)`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_eventos_padre ON eventos(evento_padre_id)`);
  return db;
}
