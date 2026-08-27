import { useCallback, useState, useEffect } from "react";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { initDb } from "../src/db/database";
import {
  buscarAnimales,
  contarAnimalesActivos,
  contarAnimalesPorHierro,
} from "../src/services/animalService";

const FINCA_ID_PRUEBA = "finca-prueba-1";

export default function Index() {
  const [numero, setNumero] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [listo, setListo] = useState(false);
  const [total, setTotal] = useState(0);
  const [resumenHierros, setResumenHierros] = useState<any[]>([]);
  const [hierroSeleccionado, setHierroSeleccionado] = useState<string>();

  useEffect(() => {
    async function iniciar() {
      await initDb();
      setListo(true);
    }
    iniciar();
  }, []);

  async function recargarBusqueda() {
    const [animales, cantidad, hierros] = await Promise.all([
      buscarAnimales(FINCA_ID_PRUEBA, numero, hierroSeleccionado),
      contarAnimalesActivos(FINCA_ID_PRUEBA),
      contarAnimalesPorHierro(FINCA_ID_PRUEBA),
    ]);
    setResultados(animales);
    setTotal(cantidad);
    setResumenHierros(hierros);
  }

  useFocusEffect(
    useCallback(() => {
      if (listo) recargarBusqueda();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listo, hierroSeleccionado]),
  );

  useEffect(() => {
    if (!listo) return;
    recargarBusqueda();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numero, listo, hierroSeleccionado]);

  const existeExacto = resultados.some((a) => a.numero === numero);

  function registrarNuevaVaca() {
    router.push({ pathname: "/animal/nuevo", params: { numero } });
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={styles.container}>
      <View style={styles.encabezado}>
        <View>
          <Text style={styles.finca}>Mi finca</Text>
          <Text style={styles.titulo}>{total} {total === 1 ? "animal" : "animales"}</Text>
        </View>
        <View style={styles.bajasLinks}>
          <TouchableOpacity onPress={() => router.push("/vendidos")}><Text style={styles.vendidos}>Vendidos</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/fallecidos")}><Text style={styles.vendidos}>Fallecidos</Text></TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.comprar} onPress={() => router.push("/animal/comprar")}>
        <Ionicons name="cart-outline" size={20} color="#2e7d32" />
        <Text style={styles.comprarTexto}>Registrar compra</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/comprados")}>
        <Text style={styles.historialCompras}>Ver historial de compras</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Buscar por número"
        keyboardType="numeric"
        value={numero}
        onChangeText={setNumero}
      />

      {resumenHierros.length > 0 && (
        <View style={styles.resumenHierros}>
          <TouchableOpacity style={[styles.resumenHierro, !hierroSeleccionado && styles.hierroActivo]} onPress={() => setHierroSeleccionado(undefined)}>
            <Text style={styles.resumenCantidad}>{total}</Text><Text style={styles.resumenNombre}>Todos</Text>
          </TouchableOpacity>
          {resumenHierros.map((hierro) => (
            <TouchableOpacity
              key={hierro.hierro_id || "sin-hierro"}
              style={[styles.resumenHierro, hierroSeleccionado === (hierro.hierro_id || "sin-hierro") && styles.hierroActivo]}
              onPress={() => setHierroSeleccionado(hierro.hierro_id || "sin-hierro")}
            >
              <Text style={styles.resumenCantidad}>{hierro.total}</Text>
              <Text style={styles.resumenNombre} numberOfLines={1}>
                {hierro.nombre}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.gestionarHierros} onPress={() => router.push("/hierros")}><Text style={styles.gestionarTexto}>+ Gestionar</Text></TouchableOpacity>
        </View>
      )}

      {numero.length > 0 && !existeExacto && (
        <TouchableOpacity style={styles.boton} onPress={registrarNuevaVaca}>
          <Text style={styles.botonTexto}>+ Registrar vaca {numero}</Text>
        </TouchableOpacity>
      )}

      <FlatList
        style={{ width: "100%" }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        data={resultados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.fila}
            onPress={() =>
              router.push({ pathname: "/animal/[id]", params: { id: item.id } })
            }
          >
            <View style={styles.insignia}>{item.foto_uri ? <Image source={{ uri: item.foto_uri }} style={styles.miniatura} /> : <Text style={styles.insigniaTexto}>{item.numero || "—"}</Text>}</View>
            <View style={styles.datos}>
              <Text style={styles.filaTexto}>{item.numero ? `Vaca ${item.numero}${item.nombre ? ` · ${item.nombre}` : ""}` : item.nombre || (item.madre_numero ? `Cría de vaca ${item.madre_numero}` : "Animal comprado")}</Text>
              <Text style={styles.filaSub}>{[item.raza, item.hierro_nombre].filter(Boolean).join(" · ") || "Sin datos adicionales"}</Text>
              {item.compra_vendedor ? (
                <Text style={styles.filaCompra} numberOfLines={1}>
                  Vendedor: {item.compra_vendedor} · {item.compra_peso} kg
                  {item.compra_valor != null ? ` · $ ${item.compra_valor.toLocaleString("es-CO")} COP` : ""}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={24} color="#888" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.vacio}>No hay animales que coincidan.</Text>
        }
      />
    </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
    padding: 20,
    gap: 12,
  },
  encabezado: { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  finca: { color: "#666", fontSize: 16 },
  titulo: { fontSize: 28, fontWeight: "bold", marginTop: 4 },
  vendidos: { color: "#2e7d32", fontWeight: "600", paddingVertical: 8 },
  bajasLinks: { alignItems: "flex-end" },
  comprar: { minHeight: 48, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2e7d32", borderRadius: 12 },
  comprarTexto: { color: "#2e7d32", fontWeight: "700" },
  historialCompras: { color: "#2e7d32", fontWeight: "600", textAlign: "center", paddingVertical: 4 },
  resumenHierros: { width: "100%", flexDirection: "row", flexWrap: "wrap", gap: 8 },
  resumenHierro: { backgroundColor: "#f1f6f1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, minWidth: 100 },
  hierroActivo: { borderWidth: 2, borderColor: "#2e7d32", paddingHorizontal: 10, paddingVertical: 7 },
  gestionarHierros: { justifyContent: "center", paddingHorizontal: 8 },
  gestionarTexto: { color: "#2e7d32", fontWeight: "700" },
  resumenCantidad: { color: "#2e7d32", fontSize: 19, fontWeight: "700" },
  resumenNombre: { color: "#555", fontSize: 13, marginTop: 1 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    width: "100%",
    fontSize: 20,
    textAlign: "center",
  },
  boton: {
    backgroundColor: "#2e7d32",
    padding: 12,
    borderRadius: 8,
    width: "100%",
  },
  botonTexto: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
  fila: {
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#e1e1e1", borderRadius: 14,
    width: "100%",
    flexDirection: "row", alignItems: "center",
  },
  insignia: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#d5e8ff", alignItems: "center", justifyContent: "center" },
  insigniaTexto: { color: "#1f5797", fontSize: 18, fontWeight: "700" },
  miniatura: { width: "100%", height: "100%" },
  datos: { flex: 1, marginLeft: 14 },
  filaTexto: { fontSize: 18, fontWeight: "700" },
  filaSub: { fontSize: 15, color: "#666", marginTop: 2 },
  filaCompra: { fontSize: 12, color: "#2e7d32", marginTop: 4 },
  vacio: { textAlign: "center", color: "#999", marginTop: 20 },
});
