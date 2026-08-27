import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { venderAnimal } from "../../src/services/animalService";

export default function Venta() {
  const params = useLocalSearchParams<{
    animalId: string | string[];
    numero?: string;
    nombre?: string;
  }>();
  const animalId = Array.isArray(params.animalId)
    ? params.animalId[0]
    : params.animalId;
  const [comprador, setComprador] = useState("");
  const [peso, setPeso] = useState("");
  const [valor, setValor] = useState("");
  const [observacion, setObservacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  function confirmar() {
    if (!comprador.trim())
      return Alert.alert(
        "Falta el comprador",
        "Escribe a quién se vendió el animal.",
      );
    const numeroPeso = Number(peso.trim().replace(",", "."));
    if (!Number.isFinite(numeroPeso) || numeroPeso <= 0)
      return Alert.alert(
        "Falta el peso",
        "Escribe el peso de venta en kilogramos.",
      );
    const numeroValor = valor ? Number(valor) : null;
    Alert.alert(
      "Confirmar venta",
      "El animal saldrá del inventario activo y conservará su historial.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar venta",
          style: "destructive",
          onPress: async () => {
            if (!animalId || guardando) return;
            setGuardando(true);
            try {
              await venderAnimal({
                animalId,
                comprador: comprador.trim(),
                pesoVenta: numeroPeso,
                valor: numeroValor,
                observacion: observacion.trim() || null,
              });
              Alert.alert(
                "Venta registrada",
                `Vendido a ${comprador.trim()}.`,
                [{ text: "Listo", onPress: () => router.dismissAll() }],
              );
            } catch {
              Alert.alert("Error", "No fue posible registrar la venta.");
              setGuardando(false);
            }
          },
        },
      ],
    );
  }
  const animal = params.numero
    ? `Vaca ${params.numero}${params.nombre ? ` · ${params.nombre}` : ""}`
    : params.nombre || "Cría";
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: "Registrar venta" }} />
      <Text style={styles.animal}>{animal}</Text>
      <Text style={styles.titulo}>Venta</Text>
      <Text style={styles.label}>Comprador</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre o empresa"
        value={comprador}
        onChangeText={setComprador}
      />
      <Text style={styles.label}>Peso de venta (kg)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="Obligatorio"
        value={peso}
        onChangeText={setPeso}
      />
      <Text style={styles.label}>Valor de compra (COP)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="$ 0 · Opcional"
        value={valor ? `$ ${Number(valor).toLocaleString("es-CO")}` : ""}
        onChangeText={(texto) => setValor(texto.replace(/\D/g, ""))}
      />
      <Text style={styles.label}>Observación</Text>
      <TextInput
        style={[styles.input, styles.area]}
        multiline
        placeholder="Opcional"
        value={observacion}
        onChangeText={setObservacion}
      />
      <TouchableOpacity
        style={[styles.boton, guardando && styles.disabled]}
        disabled={guardando}
        onPress={confirmar}
      >
        <Text style={styles.botonTexto}>
          {guardando ? "Guardando…" : "Registrar venta"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  contenido: { padding: 20, paddingBottom: 40 },
  animal: { color: "#2e7d32", fontSize: 16, fontWeight: "700" },
  titulo: { fontSize: 28, fontWeight: "700", marginTop: 6 },
  label: { fontSize: 16, fontWeight: "700", marginTop: 22, marginBottom: 8 },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
  },
  area: { minHeight: 100, paddingTop: 14, textAlignVertical: "top" },
  boton: {
    minHeight: 60,
    backgroundColor: "#2e7d32",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  botonTexto: { color: "#fff", fontSize: 18, fontWeight: "700" },
  disabled: { opacity: 0.5 },
});
