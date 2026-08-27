import * as Crypto from "expo-crypto";
import * as Location from "expo-location";
import { getDb } from "../db/database";

function uuid() {
  return Crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

async function encolar(db, tabla, registroId, operacion, payload) {
  await db.runAsync(
    `INSERT INTO outbox (id, tabla, registro_id, operacion, payload, intentos, creado_en)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [uuid(), tabla, registroId, operacion, JSON.stringify(payload), nowIso()],
  );
}

// -------------------- ANIMALES --------------------

export async function crearAnimal({
  fincaId,
  numero,
  nombre,
  hierroId,
  raza,
  fotoUri,
}) {
  const db = await getDb();
  const id = uuid();
  const ahora = nowIso();

  const animal = {
    id,
    finca_id: fincaId,
    numero,
    nombre: nombre || null,
    hierro_id: hierroId || null,
    raza: raza || null,
    foto_uri: fotoUri || null,
    activo: 1,
    creado_en: ahora,
    actualizado_en: ahora,
    sincronizado: 0,
  };

  await db.runAsync(
    `INSERT INTO animales (id, finca_id, numero, nombre, hierro_id, raza, foto_uri, activo, creado_en, actualizado_en, sincronizado)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0)`,
    [
      id,
      fincaId,
      numero,
      nombre || null,
      hierroId || null,
      raza || null,
      fotoUri || null,
      ahora,
      ahora,
    ],
  );

  await encolar(db, "animales", id, "crear", animal);
  return animal;
}

export async function buscarAnimales(
  fincaId,
  textoNumero = "",
  hierroId = /** @type {string | undefined} */ (undefined),
) {
  const db = await getDb();
  const filtroHierro = hierroId === "sin-hierro"
    ? "AND a.hierro_id IS NULL"
    : hierroId ? "AND a.hierro_id = ?" : "";
  const parametros = [fincaId, `%${textoNumero}%`];
  if (hierroId && hierroId !== "sin-hierro") parametros.push(hierroId);
  return db.getAllAsync(
    `SELECT a.*, h.nombre AS hierro_nombre, m.numero AS madre_numero,
       (SELECT e.vendedor FROM eventos e WHERE e.animal_id = a.id AND e.tipo = 'compra' ORDER BY e.fecha DESC LIMIT 1) AS compra_vendedor,
       (SELECT e.peso_venta FROM eventos e WHERE e.animal_id = a.id AND e.tipo = 'compra' ORDER BY e.fecha DESC LIMIT 1) AS compra_peso,
       (SELECT e.valor FROM eventos e WHERE e.animal_id = a.id AND e.tipo = 'compra' ORDER BY e.fecha DESC LIMIT 1) AS compra_valor
     FROM animales a
     LEFT JOIN hierros h ON h.id = a.hierro_id
     LEFT JOIN animales m ON m.id = a.madre_id
     WHERE a.finca_id = ? AND a.activo = 1 AND a.numero LIKE ? ${filtroHierro}
     ORDER BY a.numero`, parametros,
  );
}

export async function contarAnimalesActivos(fincaId) {
  const db = await getDb();
  const fila = await db.getFirstAsync(
    `SELECT COUNT(*) AS total FROM animales WHERE finca_id = ? AND activo = 1`,
    [fincaId],
  );
  return fila?.total || 0;
}

export async function contarAnimalesPorHierro(fincaId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT
       a.hierro_id,
       COALESCE(h.nombre, 'Sin hierro') AS nombre,
       COUNT(*) AS total
     FROM animales a
     LEFT JOIN hierros h ON h.id = a.hierro_id
     WHERE a.finca_id = ? AND a.activo = 1
     GROUP BY a.hierro_id, h.nombre
     ORDER BY CASE WHEN a.hierro_id IS NULL THEN 1 ELSE 0 END, h.nombre`,
    [fincaId],
  );
}

export async function listarAnimalesVendidos(fincaId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT a.*, m.numero AS madre_numero,
       (SELECT e.comprador FROM eventos e WHERE e.animal_id = a.id AND e.tipo = 'venta' ORDER BY e.fecha DESC LIMIT 1) AS comprador,
       (SELECT e.valor FROM eventos e WHERE e.animal_id = a.id AND e.tipo = 'venta' ORDER BY e.fecha DESC LIMIT 1) AS valor,
       (SELECT e.peso_venta FROM eventos e WHERE e.animal_id = a.id AND e.tipo = 'venta' ORDER BY e.fecha DESC LIMIT 1) AS peso_venta
     FROM animales a
     LEFT JOIN animales m ON m.id = a.madre_id
     WHERE a.finca_id = ? AND a.estado = 'vendido' ORDER BY a.actualizado_en DESC`,
    [fincaId],
  );
}

export async function listarAnimalesComprados(fincaId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT a.*, m.numero AS madre_numero,
       (SELECT e.vendedor FROM eventos e WHERE e.animal_id = a.id AND e.tipo = 'compra' ORDER BY e.fecha DESC LIMIT 1) AS vendedor,
       (SELECT e.peso_venta FROM eventos e WHERE e.animal_id = a.id AND e.tipo = 'compra' ORDER BY e.fecha DESC LIMIT 1) AS peso_compra,
       (SELECT e.valor FROM eventos e WHERE e.animal_id = a.id AND e.tipo = 'compra' ORDER BY e.fecha DESC LIMIT 1) AS valor_compra,
       (SELECT e.fecha FROM eventos e WHERE e.animal_id = a.id AND e.tipo = 'compra' ORDER BY e.fecha DESC LIMIT 1) AS fecha_compra
     FROM animales a LEFT JOIN animales m ON m.id = a.madre_id
     WHERE a.finca_id = ? AND EXISTS (SELECT 1 FROM eventos e WHERE e.animal_id = a.id AND e.tipo = 'compra')
     ORDER BY fecha_compra DESC`,
    [fincaId],
  );
}

export async function obtenerAnimal(animalId) {
  const db = await getDb();
  return db.getFirstAsync(
    `SELECT a.*, h.nombre AS hierro_nombre, m.numero AS madre_numero FROM animales a
     LEFT JOIN hierros h ON h.id = a.hierro_id
     LEFT JOIN animales m ON m.id = a.madre_id
     WHERE a.id = ? AND a.activo = 1`,
    [animalId],
  );
}

export async function listarCrias(madreId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT a.*, h.nombre AS hierro_nombre
     FROM animales a LEFT JOIN hierros h ON h.id = a.hierro_id
     WHERE a.madre_id = ? ORDER BY a.fecha_nacimiento DESC, a.creado_en DESC`,
    [madreId],
  );
}

export async function actualizarDatosAnimal({ animalId, numero, nombre, raza, hierroId, fotoUri }) {
  const db = await getDb();
  const ahora = nowIso();
  await db.runAsync(
    `UPDATE animales
     SET numero = COALESCE(?, numero), nombre = ?, raza = ?, hierro_id = ?, foto_uri = ?, actualizado_en = ?, sincronizado = 0
     WHERE id = ?`,
    [numero ?? null, nombre || null, raza || null, hierroId || null, fotoUri || null, ahora, animalId],
  );
  const animal = await db.getFirstAsync(`SELECT * FROM animales WHERE id = ?`, [animalId]);
  if (!animal) throw new Error("Animal no encontrado");
  await encolar(db, "animales", animalId, "actualizar", animal);
  return animal;
}

export async function listarHierros(fincaId) {
  const db = await getDb();
  return db.getAllAsync(`SELECT * FROM hierros WHERE finca_id = ? ORDER BY nombre`, [fincaId]);
}

export async function crearHierro(fincaId, nombre) {
  const db = await getDb();
  const id = uuid();
  const ahora = nowIso();
  const hierro = { id, finca_id: fincaId, nombre, creado_en: ahora, sincronizado: 0 };
  await db.runAsync(
    `INSERT INTO hierros (id, finca_id, nombre, creado_en, sincronizado) VALUES (?, ?, ?, ?, 0)`,
    [id, fincaId, nombre, ahora],
  );
  await encolar(db, "hierros", id, "crear", hierro);
  return hierro;
}

export async function registrarCompra({ fincaId, numero, nombre, raza, hierroId, fotoUri, vendedor, peso, valor }) {
  const animal = await crearAnimal({ fincaId, numero, nombre, raza, hierroId, fotoUri });
  const db = await getDb(); const id = uuid(); const ahora = nowIso();
  const evento = { id, animal_id: animal.id, tipo: "compra", fecha: ahora, nota: null, vendedor, peso_venta: peso, valor: valor ?? null, creado_en: ahora, sincronizado: 0, usuario_id: null };
  await db.runAsync(`INSERT INTO eventos (id, animal_id, tipo, fecha, nota, creado_en, sincronizado, usuario_id, vendedor, peso_venta, valor) VALUES (?, ?, 'compra', ?, NULL, ?, 0, NULL, ?, ?, ?)`, [id, animal.id, ahora, ahora, vendedor, peso, valor ?? null]);
  await encolar(db, "eventos", id, "crear", evento);
  return animal;
}

// -------------------- EVENTOS --------------------

export async function registrarEvento({
  animalId,
  tipo,
  nota = /** @type {string | null} */ (null),
  usuarioId = /** @type {string | null} */ (null),
}) {
  const db = await getDb();
  const id = uuid();
  const ahora = nowIso();

  let lat = null,
    lng = null;
  try {
    const permiso = await Location.getForegroundPermissionsAsync();
    if (permiso.granted) {
      const pos = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise((_, rej) => setTimeout(() => rej("timeout"), 2000)),
      ]);
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    }
  } catch {
    // sin GPS no pasa nada, el evento se guarda igual
  }
  const evento = {
    id,
    animal_id: animalId,
    tipo,
    fecha: ahora,
    nota,
    lat,
    lng,
    creado_en: ahora,
    sincronizado: 0,
    usuario_id: usuarioId,
  };

  await db.runAsync(
    `INSERT INTO eventos (id, animal_id, tipo, fecha, nota, lat, lng, creado_en, sincronizado, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [id, animalId, tipo, ahora, nota, lat, lng, ahora, usuarioId],
  );

  await encolar(db, "eventos", id, "crear", evento);
  return evento;
}

export async function historialAnimal(animalId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT * FROM eventos WHERE animal_id = ? ORDER BY fecha DESC`,
    [animalId],
  );
}

export async function obtenerEvento(eventoId) {
  const db = await getDb();
  return db.getFirstAsync(`SELECT * FROM eventos WHERE id = ?`, [eventoId]);
}

export async function listarEvoluciones(enfermedadId) {
  const db = await getDb();
  return db.getAllAsync(`SELECT * FROM eventos WHERE evento_padre_id = ? AND tipo = 'evolucion' ORDER BY fecha DESC`, [enfermedadId]);
}

export async function registrarEnfermedad({ animalId, diagnostico, tratamiento, evolucion }) {
  const db = await getDb();
  const id = uuid(); const ahora = nowIso();
  const evento = { id, animal_id: animalId, tipo: "enfermedad", fecha: ahora, nota: evolucion || null, diagnostico, tratamiento: tratamiento || null, evento_padre_id: null, creado_en: ahora, sincronizado: 0, usuario_id: null };
  await db.runAsync(`INSERT INTO eventos (id, animal_id, tipo, fecha, nota, lat, lng, creado_en, sincronizado, usuario_id, diagnostico, tratamiento, evento_padre_id) VALUES (?, ?, 'enfermedad', ?, ?, NULL, NULL, ?, 0, NULL, ?, ?, NULL)`, [id, animalId, ahora, evolucion || null, ahora, diagnostico, tratamiento || null]);
  await encolar(db, "eventos", id, "crear", evento); return id;
}

export async function registrarEvolucion({ animalId, enfermedadId, nota }) {
  const db = await getDb(); const id = uuid(); const ahora = nowIso();
  const evento = { id, animal_id: animalId, tipo: "evolucion", fecha: ahora, nota, diagnostico: null, evento_padre_id: enfermedadId, creado_en: ahora, sincronizado: 0, usuario_id: null };
  await db.runAsync(`INSERT INTO eventos (id, animal_id, tipo, fecha, nota, lat, lng, creado_en, sincronizado, usuario_id, diagnostico, evento_padre_id) VALUES (?, ?, 'evolucion', ?, ?, NULL, NULL, ?, 0, NULL, NULL, ?)`, [id, animalId, ahora, nota, ahora, enfermedadId]);
  await encolar(db, "eventos", id, "crear", evento);
}

export async function registrarRecuperacion({ animalId, enfermedadId, nota }) {
  const db = await getDb(); const id = uuid(); const ahora = nowIso();
  await db.withExclusiveTransactionAsync(async (txn) => {
    const enfermedad = await txn.getFirstAsync(`SELECT * FROM eventos WHERE id = ? AND tipo = 'enfermedad' AND resuelto_en IS NULL`, [enfermedadId]);
    if (!enfermedad) throw new Error("La enfermedad ya está cerrada");
    const evento = { id, animal_id: animalId, tipo: "recuperacion", fecha: ahora, nota: nota || "Animal recuperado", evento_padre_id: enfermedadId, creado_en: ahora, sincronizado: 0, usuario_id: null };
    await txn.runAsync(`INSERT INTO eventos (id, animal_id, tipo, fecha, nota, creado_en, sincronizado, evento_padre_id) VALUES (?, ?, 'recuperacion', ?, ?, ?, 0, ?)`, [id, animalId, ahora, evento.nota, ahora, enfermedadId]);
    await txn.runAsync(`UPDATE eventos SET resuelto_en = ?, sincronizado = 0 WHERE id = ?`, [ahora, enfermedadId]);
    await encolar(txn, "eventos", id, "crear", evento);
    await encolar(txn, "eventos", enfermedadId, "actualizar", { ...enfermedad, resuelto_en: ahora, sincronizado: 0 });
  });
}

export async function venderAnimal({ animalId, comprador, pesoVenta, valor, observacion }) {
  const db = await getDb();
  const ahora = nowIso();
  const eventoId = uuid();

  await db.withExclusiveTransactionAsync(async (txn) => {
    const animal = await txn.getFirstAsync(
      `SELECT * FROM animales WHERE id = ? AND activo = 1`,
      [animalId],
    );
    if (!animal) throw new Error("Animal no encontrado o ya vendido");

    const evento = {
      id: eventoId,
      animal_id: animalId,
      tipo: "venta",
      fecha: ahora,
      nota: observacion || null,
      comprador,
      valor: valor ?? null,
      peso_venta: pesoVenta,
      lat: null,
      lng: null,
      creado_en: ahora,
      sincronizado: 0,
      usuario_id: null,
    };

    await txn.runAsync(
      `INSERT INTO eventos (id, animal_id, tipo, fecha, nota, lat, lng, creado_en, sincronizado, usuario_id, comprador, valor, peso_venta)
       VALUES (?, ?, 'venta', ?, ?, NULL, NULL, ?, 0, NULL, ?, ?, ?)`,
      [eventoId, animalId, ahora, observacion || null, ahora, comprador, valor ?? null, pesoVenta],
    );
    await txn.runAsync(
      `UPDATE animales SET activo = 0, estado = 'vendido', actualizado_en = ?, sincronizado = 0 WHERE id = ?`,
      [ahora, animalId],
    );

    await encolar(txn, "eventos", eventoId, "crear", evento);
    await encolar(txn, "animales", animalId, "actualizar", {
      ...animal,
      activo: 0,
      estado: "vendido",
      actualizado_en: ahora,
      sincronizado: 0,
    });
  });
}

export async function reactivarAnimal(animalId) {
  const db = await getDb();
  const ahora = nowIso();
  const eventoId = uuid();

  await db.withExclusiveTransactionAsync(async (txn) => {
    const animal = await txn.getFirstAsync(
      `SELECT * FROM animales WHERE id = ? AND activo = 0`,
      [animalId],
    );
    if (!animal) throw new Error("Animal no encontrado o ya activo");

    const notaReactivacion = animal.estado === "fallecido" ? "Muerte deshecha" : "Venta deshecha";

    const evento = {
      id: eventoId,
      animal_id: animalId,
      tipo: "reactivacion",
      fecha: ahora,
      nota: notaReactivacion,
      lat: null,
      lng: null,
      creado_en: ahora,
      sincronizado: 0,
      usuario_id: null,
    };

    await txn.runAsync(
      `INSERT INTO eventos (id, animal_id, tipo, fecha, nota, lat, lng, creado_en, sincronizado, usuario_id)
       VALUES (?, ?, 'reactivacion', ?, ?, NULL, NULL, ?, 0, NULL)`,
      [eventoId, animalId, ahora, notaReactivacion, ahora],
    );
    await txn.runAsync(
      `UPDATE animales SET activo = 1, estado = 'activo', actualizado_en = ?, sincronizado = 0 WHERE id = ?`,
      [ahora, animalId],
    );
    await encolar(txn, "eventos", eventoId, "crear", evento);
    if (animal.madre_id && animal.estado === "fallecido") {
      const avisoId = uuid();
      const aviso = { id: avisoId, animal_id: animal.madre_id, tipo: "reactivacion_cria", fecha: ahora, nota: animal.numero ? `Cría ${animal.numero}` : animal.nombre || "Cría", creado_en: ahora, sincronizado: 0, usuario_id: null };
      await txn.runAsync(`INSERT INTO eventos (id, animal_id, tipo, fecha, nota, creado_en, sincronizado) VALUES (?, ?, 'reactivacion_cria', ?, ?, ?, 0)`, [avisoId, animal.madre_id, ahora, aviso.nota, ahora]);
      await encolar(txn, "eventos", avisoId, "crear", aviso);
    }
    await encolar(txn, "animales", animalId, "actualizar", {
      ...animal,
      activo: 1,
      estado: "activo",
      actualizado_en: ahora,
      sincronizado: 0,
    });
  });
}

export async function listarAnimalesFallecidos(fincaId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT a.*, m.numero AS madre_numero,
       (SELECT e.nota FROM eventos e WHERE e.animal_id = a.id AND e.tipo = 'muerte' ORDER BY e.fecha DESC LIMIT 1) AS causa_muerte
     FROM animales a
     LEFT JOIN animales m ON m.id = a.madre_id
     WHERE a.finca_id = ? AND a.estado = 'fallecido' ORDER BY a.actualizado_en DESC`,
    [fincaId],
  );
}

export async function registrarMuerte(
  animalId,
  enfermedadId = /** @type {string | undefined} */ (undefined),
  causa = /** @type {string | undefined} */ (undefined),
) {
  const db = await getDb();
  const ahora = nowIso();
  const eventoId = uuid();
  await db.withExclusiveTransactionAsync(async (txn) => {
    const animal = await txn.getFirstAsync(`SELECT * FROM animales WHERE id = ? AND activo = 1`, [animalId]);
    if (!animal) throw new Error("Animal no encontrado");
    const evento = { id: eventoId, animal_id: animalId, tipo: "muerte", fecha: ahora, nota: causa || (enfermedadId ? "Relacionada con enfermedad" : null), evento_padre_id: enfermedadId || null, lat: null, lng: null, creado_en: ahora, sincronizado: 0, usuario_id: null };
    await txn.runAsync(`INSERT INTO eventos (id, animal_id, tipo, fecha, nota, lat, lng, creado_en, sincronizado, usuario_id, evento_padre_id) VALUES (?, ?, 'muerte', ?, ?, NULL, NULL, ?, 0, NULL, ?)`, [eventoId, animalId, ahora, evento.nota, ahora, enfermedadId || null]);
    await txn.runAsync(`UPDATE animales SET activo = 0, estado = 'fallecido', actualizado_en = ?, sincronizado = 0 WHERE id = ?`, [ahora, animalId]);
    await encolar(txn, "eventos", eventoId, "crear", evento);
    if (animal.madre_id) {
      const bajaId = uuid();
      const baja = { id: bajaId, animal_id: animal.madre_id, tipo: "baja_cria", fecha: ahora, nota: animal.numero ? `Cría ${animal.numero}` : animal.nombre || "Cría", creado_en: ahora, sincronizado: 0, usuario_id: null };
      await txn.runAsync(`INSERT INTO eventos (id, animal_id, tipo, fecha, nota, creado_en, sincronizado) VALUES (?, ?, 'baja_cria', ?, ?, ?, 0)`, [bajaId, animal.madre_id, ahora, baja.nota, ahora]);
      await encolar(txn, "eventos", bajaId, "crear", baja);
    }
    await encolar(txn, "animales", animalId, "actualizar", { ...animal, activo: 0, estado: "fallecido", actualizado_en: ahora, sincronizado: 0 });
  });
}

export async function registrarCria({
  madreId,
  numero,
  nombre,
  sexo,
  raza,
  hierroId,
  pesoNacimiento,
  fechaNacimiento,
  fotoUri,
  observacion,
}) {
  const db = await getDb();
  const ahora = nowIso();
  const criaId = uuid();
  const eventoMadreId = uuid();
  const eventoCriaId = uuid();

  await db.withExclusiveTransactionAsync(async (txn) => {
    const madre = await txn.getFirstAsync(`SELECT * FROM animales WHERE id = ? AND activo = 1`, [madreId]);
    if (!madre) throw new Error("Madre no encontrada");

    const cria = {
      id: criaId, finca_id: madre.finca_id, numero, nombre: nombre || null, hierro_id: hierroId || null,
      raza: raza || null, foto_uri: fotoUri || null, activo: 1, sexo,
      peso_nacimiento: pesoNacimiento ?? null, madre_id: madreId,
      fecha_nacimiento: fechaNacimiento || null,
      creado_en: ahora, actualizado_en: ahora, sincronizado: 0,
    };
    await txn.runAsync(
      `INSERT INTO animales (id, finca_id, numero, nombre, hierro_id, raza, foto_uri, activo, creado_en, actualizado_en, sincronizado, sexo, peso_nacimiento, madre_id, fecha_nacimiento)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0, ?, ?, ?, ?)`,
      [criaId, madre.finca_id, numero || "", nombre || null, hierroId || null, raza || null, fotoUri || null, ahora, ahora, sexo, pesoNacimiento ?? null, madreId, fechaNacimiento || null],
    );

    const detalle = ["Nueva cría", sexo === "hembra" ? "Hembra" : "Macho", fechaNacimiento ? `Nacimiento: ${fechaNacimiento}` : null, raza || null, pesoNacimiento != null ? `${pesoNacimiento} kg` : null, observacion || null].filter(Boolean).join(" · ");
    const eventoMadre = { id: eventoMadreId, animal_id: madreId, tipo: "cria", fecha: ahora, nota: detalle, lat: null, lng: null, creado_en: ahora, sincronizado: 0, usuario_id: null };
    const eventoCria = { id: eventoCriaId, animal_id: criaId, tipo: "nacimiento", fecha: ahora, nota: `Madre: vaca ${madre.numero}`, lat: null, lng: null, creado_en: ahora, sincronizado: 0, usuario_id: null };
    for (const evento of [eventoMadre, eventoCria]) {
      await txn.runAsync(
        `INSERT INTO eventos (id, animal_id, tipo, fecha, nota, lat, lng, creado_en, sincronizado, usuario_id) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, 0, NULL)`,
        [evento.id, evento.animal_id, evento.tipo, ahora, evento.nota, ahora],
      );
      await encolar(txn, "eventos", evento.id, "crear", evento);
    }
    await encolar(txn, "animales", criaId, "crear", cria);
  });
  return criaId;
}
