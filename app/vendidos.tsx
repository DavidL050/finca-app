import { useCallback, useState } from "react";
import { Stack, useFocusEffect } from "expo-router";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { listarAnimalesVendidos, reactivarAnimal } from "../src/services/animalService";

const FINCA_ID_PRUEBA = "finca-prueba-1";

type Animal = { id: string; numero: string; nombre: string | null; raza: string | null; actualizado_en: string; madre_numero: string | null; comprador: string | null; valor: number | null; peso_venta: number | null };

export default function Vendidos() {
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [reactivando, setReactivando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setAnimales(await listarAnimalesVendidos(FINCA_ID_PRUEBA) as Animal[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  function confirmarReactivacion(animal: Animal) {
    const nombreAnimal = animal.numero
      ? `vaca ${animal.numero}${animal.nombre ? ` · ${animal.nombre}` : ""}`
      : animal.nombre || (animal.madre_numero ? `cría de vaca ${animal.madre_numero}` : "animal comprado");
    Alert.alert(
      `Reactivar ${nombreAnimal}`,
      "Volverá al inventario activo con todos sus datos e historial.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reactivar",
          onPress: async () => {
            if (reactivando) return;
            setReactivando(animal.id);
            try {
              await reactivarAnimal(animal.id);
              await cargar();
              Alert.alert("Animal reactivado", `${nombreAnimal} volvió al inventario.`);
            } catch {
              Alert.alert("Error", "No fue posible reactivar el animal.");
            } finally {
              setReactivando(null);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Animales vendidos" }} />
      <Text style={styles.titulo}>{animales.length} vendidos</Text>
      <FlatList
        data={animales}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <View style={styles.fila}>
            <View style={styles.insignia}><Text style={styles.numero}>{item.numero || "—"}</Text></View>
            <View style={styles.datos}>
              <Text style={styles.nombre}>{item.numero ? `Vaca ${item.numero}${item.nombre ? ` · ${item.nombre}` : ""}` : item.nombre || (item.madre_numero ? `Cría de vaca ${item.madre_numero}` : "Animal comprado")}</Text>
              <Text style={styles.detalle}>{item.raza || "Sin raza registrada"}</Text>
              {item.comprador ? <Text style={styles.comprador}>Comprador: {item.comprador} · {item.peso_venta} kg{item.valor != null ? ` · $ ${item.valor.toLocaleString("es-CO")} COP` : ""}</Text> : null}
              <Text style={styles.fecha}>Vendida: {new Date(item.actualizado_en).toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity
              style={[styles.reactivar, reactivando && styles.deshabilitado]}
              disabled={reactivando !== null}
              onPress={() => confirmarReactivacion(item)}
            >
              <Text style={styles.reactivarTexto}>{reactivando === item.id ? "Activando…" : "Reactivar"}</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.vacio}>Aún no hay animales vendidos.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  titulo: { fontSize: 26, fontWeight: "700", marginVertical: 18 },
  lista: { paddingBottom: 30 },
  fila: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e1e1e1", borderRadius: 14, padding: 14, marginBottom: 10 },
  insignia: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#eee", alignItems: "center", justifyContent: "center", marginRight: 14 },
  numero: { fontSize: 18, fontWeight: "700", color: "#555" },
  datos: { flex: 1 },
  nombre: { fontSize: 18, fontWeight: "700" },
  detalle: { color: "#666", marginTop: 2 },
  comprador: { color: "#444", fontSize: 13, marginTop: 4 },
  fecha: { color: "#888", fontSize: 12, marginTop: 4 },
  reactivar: { minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: "#2e7d32", paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  reactivarTexto: { color: "#2e7d32", fontWeight: "700" },
  deshabilitado: { opacity: 0.5 },
  vacio: { color: "#888", textAlign: "center", marginTop: 30 },
});
