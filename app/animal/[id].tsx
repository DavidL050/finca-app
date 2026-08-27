import { useCallback, useMemo, useState } from "react";
import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import {
  historialAnimal,
  listarCrias,
  obtenerAnimal,
  registrarEvento,
} from "../../src/services/animalService";

const TIPOS_EVENTO = ["cria", "vacuna", "enfermedad", "venta", "muerte"];

const ETIQUETAS: Record<string, string> = {
  cria: "Cría",
  vacuna: "Vacuna",
  enfermedad: "Enfermedad",
  venta: "Venta",
  reactivacion: "Reactivación",
  nacimiento: "Nacimiento",
  muerte: "Muerte",
  evolucion: "Evolución",
  baja_cria: "Baja de cría",
  reactivacion_cria: "Baja de cría deshecha",
  recuperacion: "Recuperación",
  compra: "Compra",
};

const ICONOS: Record<string, keyof typeof Ionicons.glyphMap> = {
  cria: "paw-outline",
  vacuna: "medical-outline",
  enfermedad: "medkit-outline",
  venta: "cash-outline",
  muerte: "heart-dislike-outline",
};

const FILTROS = {
  todos: null,
  salud: ["vacuna", "enfermedad", "evolucion", "recuperacion"],
  cria: ["cria", "nacimiento", "baja_cria", "reactivacion_cria"],
} as const;

const NOMBRES_FILTRO: Record<keyof typeof FILTROS, string> = {
  todos: "Todos",
  salud: "Salud",
  cria: "Cría",
};

type Animal = {
  id: string;
  numero: string;
  nombre: string | null;
  raza: string | null;
  hierro_nombre: string | null;
  foto_uri: string | null;
  madre_id: string | null;
  madre_numero: string | null;
};

type Evento = {
  id: string;
  tipo: string;
  fecha: string;
  nota: string | null;
  comprador: string | null;
  valor: number | null;
  peso_venta: number | null;
  vendedor: string | null;
};

type Cria = {
  id: string;
  numero: string;
  nombre: string | null;
  sexo: string | null;
  raza: string | null;
  activo: number;
  estado: string;
};

export default function AnimalDetalle() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const animalId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [crias, setCrias] = useState<Cria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<keyof typeof FILTROS>("todos");

  const eventosFiltrados = useMemo(() => {
    const tipos = FILTROS[filtro];
    return tipos ? eventos.filter((evento) => (tipos as readonly string[]).includes(evento.tipo)) : eventos;
  }, [eventos, filtro]);

  const cargarFicha = useCallback(async () => {
    if (!animalId) return;

    try {
      const [animalEncontrado, historial, criasEncontradas] = await Promise.all([
        obtenerAnimal(animalId),
        historialAnimal(animalId),
        listarCrias(animalId),
      ]);
      setAnimal(animalEncontrado as Animal | null);
      setEventos(historial as Evento[]);
      setCrias(criasEncontradas as Cria[]);
    } catch {
      Alert.alert("Error", "No fue posible cargar la ficha del animal.");
    } finally {
      setCargando(false);
    }
  }, [animalId]);

  useFocusEffect(
    useCallback(() => {
      cargarFicha();
    }, [cargarFicha]),
  );

  async function guardarEvento(tipo: string) {
    if (!animalId || guardando) return;

    setGuardando(tipo);
    try {
      await registrarEvento({ animalId, tipo });
      await cargarFicha();
      Alert.alert("Evento registrado", `${ETIQUETAS[tipo]} se guardó correctamente.`);
    } catch {
      Alert.alert("Error", "No fue posible registrar el evento.");
    } finally {
      setGuardando(null);
    }
  }

  function confirmarEvento(tipo: string) {
    if (tipo === "cria") {
      if (!animalId) return;
      router.push({ pathname: "/evento/cria", params: { madreId: animalId, numeroMadre: animal?.numero || "" } });
      return;
    }
    if (tipo === "vacuna") {
      if (!animalId) return;
      router.push({
        pathname: "/evento/vacuna",
        params: { animalId, numero: animal?.numero || "" },
      });
      return;
    }

    if (tipo === "enfermedad") {
      if (!animalId) return;
      router.push({ pathname: "/evento/enfermedad", params: { animalId, numero: animal?.numero || "" } });
      return;
    }

    if (tipo === "muerte") {
      if (!animalId) return;
      router.push({ pathname: "/evento/muerte", params: { animalId, numero: animal?.numero || "", nombre: animal?.nombre || "" } });
      return;
    }

    if (tipo === "venta") {
      if (!animalId) return;
      router.push({ pathname: "/evento/venta", params: { animalId, numero: animal?.numero || "", nombre: animal?.nombre || "" } });
      return;
    }

    guardarEvento(tipo);
  }

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  if (!animal) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.vacio}>No se encontró este animal.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: animal.numero ? `Vaca ${animal.numero}` : animal.nombre || (animal.madre_numero ? `Cría de vaca ${animal.madre_numero}` : "Animal comprado") }} />

      <FlatList
        data={eventosFiltrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contenido}
        ListHeaderComponent={
          <View>
            {animal.foto_uri ? <Image source={{ uri: animal.foto_uri }} style={styles.fotoAnimal} /> : null}
            <Text style={styles.numero}>{animal.numero ? `Vaca ${animal.numero}${animal.nombre ? ` · ${animal.nombre}` : ""}` : animal.nombre || (animal.madre_numero ? `Cría de vaca ${animal.madre_numero}` : "Animal comprado")}</Text>
            <Text style={styles.raza}>{[animal.raza, animal.hierro_nombre].filter(Boolean).join(" · ") || "Sin datos adicionales"}</Text>
            {animal.madre_id ? (
              <TouchableOpacity
                style={styles.madre}
                onPress={() => router.push({ pathname: "/animal/[id]", params: { id: animal.madre_id! } })}
              >
                <Ionicons name="git-branch-outline" size={18} color="#555" />
                <Text style={styles.madreTexto}>Madre: vaca {animal.madre_numero}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.editar}
              onPress={() => router.push({ pathname: "/animal/editar", params: { id: animal.id } })}
            >
              <Ionicons name="create-outline" size={18} color="#2e7d32" />
              <Text style={styles.editarTexto}>Editar datos</Text>
            </TouchableOpacity>

            {crias.length > 0 ? (
              <View>
                <Text style={styles.subtitulo}>Crías ({crias.length})</Text>
                {crias.map((cria) => (
                  <TouchableOpacity
                    key={cria.id}
                    style={[styles.cria, !cria.activo && styles.criaInactiva]}
                    disabled={!cria.activo}
                    onPress={() => router.push({ pathname: "/animal/[id]", params: { id: cria.id } })}
                  >
                    <View style={styles.criaDatos}>
                      <Text style={styles.criaNombre}>{cria.numero ? `Vaca ${cria.numero}${cria.nombre ? ` · ${cria.nombre}` : ""}` : cria.nombre || "Cría"}</Text>
                      <Text style={styles.criaDetalle}>{[cria.sexo === "hembra" ? "Hembra" : cria.sexo === "macho" ? "Macho" : null, cria.raza, cria.estado === "vendido" ? "Vendida" : cria.estado === "fallecido" ? "Fallecida" : null].filter(Boolean).join(" · ")}</Text>
                    </View>
                    {cria.activo ? <Ionicons name="chevron-forward" size={22} color="#888" /> : null}
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <Text style={styles.subtitulo}>Registrar evento</Text>
            <View style={styles.botones}>
              {TIPOS_EVENTO.map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[styles.boton, guardando && styles.botonDeshabilitado]}
                  disabled={guardando !== null}
                  onPress={() => confirmarEvento(tipo)}
                >
                  <Ionicons name={ICONOS[tipo]} size={30} color="#1b1b1b" />
                  <Text style={styles.botonTexto}>
                    {guardando === tipo ? "Guardando…" : ETIQUETAS[tipo]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.subtitulo}>Historial</Text>
            <View style={styles.filtros}>
              {(Object.keys(FILTROS) as (keyof typeof FILTROS)[]).map((opcion) => {
                const tipos = FILTROS[opcion];
                const cantidad = tipos
                  ? eventos.filter((evento) => (tipos as readonly string[]).includes(evento.tipo)).length
                  : eventos.length;
                return (
                  <TouchableOpacity
                    key={opcion}
                    style={[styles.filtro, filtro === opcion && styles.filtroActivo]}
                    onPress={() => setFiltro(opcion)}
                  >
                    <Text style={[styles.filtroTexto, filtro === opcion && styles.filtroTextoActivo]}>
                      {NOMBRES_FILTRO[opcion]} {cantidad}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.evento}
            disabled={item.tipo !== "enfermedad"}
            onPress={() => router.push({ pathname: "/evento/enfermedad/[id]", params: { id: item.id } })}
          >
            <Text style={styles.eventoTipo}>{ETIQUETAS[item.tipo] || item.tipo}</Text>
            {item.tipo === "enfermedad" ? <Text style={styles.eventoNota}>{(item as Evento & { diagnostico?: string }).diagnostico}</Text> : null}
            <Text style={styles.eventoFecha}>
              {new Date(item.fecha).toLocaleString()}
            </Text>
            {item.nota ? <Text style={styles.eventoNota}>{item.nota}</Text> : null}
            {item.tipo === "venta" && item.comprador ? <Text style={styles.eventoNota}>Comprador: {item.comprador} · Peso: {item.peso_venta} kg{item.valor != null ? ` · Valor: $ ${item.valor.toLocaleString("es-CO")} COP` : ""}</Text> : null}
            {item.tipo === "compra" && item.vendedor ? <Text style={styles.eventoNota}>Vendedor: {item.vendedor} · Peso: {item.peso_venta} kg{item.valor != null ? ` · Valor: $ ${item.valor.toLocaleString("es-CO")} COP` : ""}</Text> : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.vacio}>{eventos.length ? "No hay eventos en esta categoría." : "Este animal todavía no tiene eventos."}</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centrado: { flex: 1, alignItems: "center", justifyContent: "center" },
  contenido: { padding: 20, paddingBottom: 40 },
  numero: { fontSize: 28, fontWeight: "700", color: "#1b1b1b" },
  fotoAnimal: { width: 130, height: 130, borderRadius: 65, marginBottom: 16, backgroundColor: "#eee" },
  raza: { fontSize: 16, color: "#666", marginTop: 4 },
  editar: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, alignSelf: "flex-start", paddingVertical: 8 },
  editarTexto: { color: "#2e7d32", fontSize: 15, fontWeight: "700" },
  madre: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  madreTexto: { color: "#555", fontSize: 15, fontWeight: "600" },
  cria: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e1e1e1", borderRadius: 12, padding: 14, marginBottom: 8 },
  criaDatos: { flex: 1 },
  criaNombre: { fontSize: 16, fontWeight: "700" },
  criaDetalle: { color: "#666", marginTop: 3, textTransform: "capitalize" },
  criaInactiva: { opacity: 0.6 },
  subtitulo: { fontSize: 18, fontWeight: "700", marginTop: 28, marginBottom: 12 },
  filtros: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  filtro: { minHeight: 42, borderWidth: 1, borderColor: "#d5d5d5", borderRadius: 21, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  filtroActivo: { backgroundColor: "#e5f4e6", borderColor: "#2e7d32" },
  filtroTexto: { color: "#555", fontWeight: "600" },
  filtroTextoActivo: { color: "#2e7d32" },
  botones: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  boton: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#d5d5d5",
    borderRadius: 8,
    width: "48%", minHeight: 110, alignItems: "center", justifyContent: "center", gap: 8,
  },
  botonDeshabilitado: { opacity: 0.55 },
  botonTexto: { color: "#1b1b1b", fontSize: 17, fontWeight: "600" },
  evento: {
    borderWidth: 1,
    borderColor: "#e4e4e4",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  eventoTipo: { fontSize: 16, fontWeight: "600" },
  eventoFecha: { color: "#777", fontSize: 13, marginTop: 4 },
  eventoNota: { color: "#444", marginTop: 8 },
  vacio: { color: "#888", textAlign: "center", marginTop: 20 },
});
