import { useState } from "react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { registrarEvento } from "../../src/services/animalService";

export default function RegistrarVacuna() {
  const params = useLocalSearchParams<{
    animalId: string | string[];
    numero?: string | string[];
  }>();
  const animalId = Array.isArray(params.animalId)
    ? params.animalId[0]
    : params.animalId;
  const numero = Array.isArray(params.numero) ? params.numero[0] : params.numero;

  const [producto, setProducto] = useState("");
  const [dosis, setDosis] = useState("");
  const [observacion, setObservacion] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    const productoLimpio = producto.trim();
    if (!productoLimpio) {
      Alert.alert("Falta el producto", "Escribe el nombre de la vacuna.");
      return;
    }
    if (!animalId || guardando) return;

    const detalles = [
      `Producto: ${productoLimpio}`,
      dosis.trim() ? `Dosis: ${dosis.trim()}` : null,
      observacion.trim() ? `Observación: ${observacion.trim()}` : null,
    ].filter(Boolean);

    setGuardando(true);
    try {
      await registrarEvento({
        animalId,
        tipo: "vacuna",
        nota: detalles.join(" · "),
      });
      Alert.alert("Vacuna registrada", "La información se guardó en el dispositivo.", [
        { text: "Listo", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "No fue posible registrar la vacuna.");
      setGuardando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Registrar vacuna" }} />
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>Vaca {numero || ""}</Text>
        <Text style={styles.titulo}>¿Qué vacuna aplicaste?</Text>
        <Text style={styles.ayuda}>Solo el producto es obligatorio.</Text>

        <View style={styles.campo}>
          <Text style={styles.etiqueta}>Producto</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Aftosa"
            value={producto}
            onChangeText={setProducto}
            returnKeyType="next"
          />
        </View>

        <View style={styles.campo}>
          <Text style={styles.etiqueta}>Dosis</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. 2 mL"
            value={dosis}
            onChangeText={setDosis}
          />
        </View>

        <View style={styles.campo}>
          <Text style={styles.etiqueta}>Observación</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Opcional"
            value={observacion}
            onChangeText={setObservacion}
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.boton, guardando && styles.botonDeshabilitado]}
          disabled={guardando}
          onPress={guardar}
        >
          <Text style={styles.botonTexto}>
            {guardando ? "Guardando…" : "Guardar vacuna"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  contenido: { padding: 20, paddingBottom: 40 },
  eyebrow: { color: "#2e7d32", fontSize: 16, fontWeight: "700" },
  titulo: { fontSize: 28, fontWeight: "700", marginTop: 8 },
  ayuda: { color: "#666", fontSize: 15, marginTop: 6, marginBottom: 24 },
  campo: { marginBottom: 18 },
  etiqueta: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: "#cfcfcf",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    backgroundColor: "#fff",
  },
  textArea: { minHeight: 110, paddingTop: 14 },
  boton: {
    minHeight: 60,
    borderRadius: 12,
    backgroundColor: "#2e7d32",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  botonDeshabilitado: { opacity: 0.55 },
  botonTexto: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
