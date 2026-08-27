import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { AnimalPhotoPicker } from "../../src/components/AnimalPhotoPicker";
import { listarHierros, obtenerAnimal, registrarCria } from "../../src/services/animalService";
import { guardarFotoAnimal } from "../../src/services/photoService";

const FINCA_ID = "finca-prueba-1";
type Hierro = { id: string; nombre: string };
type Madre = { hierro_id: string | null };

export default function FormularioCria() {
  const params = useLocalSearchParams<{ madreId: string | string[]; numeroMadre?: string }>();
  const madreId = Array.isArray(params.madreId) ? params.madreId[0] : params.madreId;
  const [sexo, setSexo] = useState<"hembra" | "macho">("hembra");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [raza, setRaza] = useState("");
  const [nombre, setNombre] = useState("");
  const [hierros, setHierros] = useState<Hierro[]>([]);
  const [hierroId, setHierroId] = useState<string | null>(null);
  const [peso, setPeso] = useState("");
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [observacion, setObservacion] = useState("");
  const [guardando, setGuardando] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!madreId) return;
    Promise.all([obtenerAnimal(madreId), listarHierros(FINCA_ID)]).then(([madre, lista]) => {
      const datosMadre = madre as Madre | null;
      setHierroId(datosMadre?.hierro_id || null);
      setHierros(lista as Hierro[]);
    });
  }, [madreId]));

  async function guardar() {
    if (!madreId || guardando) return;
    const pesoNormalizado = peso.trim().replace(",", ".");
    const pesoNumero = pesoNormalizado ? Number(pesoNormalizado) : null;
    if (pesoNumero !== null && (!Number.isFinite(pesoNumero) || pesoNumero <= 0)) return Alert.alert("Peso inválido", "Escribe un peso válido en kilogramos.");
    setGuardando(true);
    try {
      const fotoGuardada = fotoUri ? guardarFotoAnimal(fotoUri) : null;
      await registrarCria({ madreId, numero: "", nombre: nombre.trim() || null, sexo, raza: raza.trim() || null, hierroId, pesoNacimiento: pesoNumero, fechaNacimiento: fechaNacimiento.trim() || null, fotoUri: fotoGuardada, observacion: observacion.trim() || null });
      Alert.alert("Cría registrada", "Se creó el animal y se relacionó con su madre.", [{ text: "Listo", onPress: () => router.back() }]);
    } catch { Alert.alert("Error", "No fue posible registrar la cría."); setGuardando(false); }
  }

  return <ScrollView style={styles.container} contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
    <Stack.Screen options={{ title: "Registrar cría" }} />
    <Text style={styles.madre}>Madre: vaca {params.numeroMadre || ""}</Text><Text style={styles.titulo}>Nueva cría</Text>
    <Text style={styles.label}>Sexo</Text><Text style={styles.ayuda}>Selecciona una opción</Text>
    <TouchableOpacity style={[styles.sexo, sexo === "hembra" && styles.activa]} onPress={() => setSexo("hembra")}><Text style={styles.sexoTexto}>Hembra</Text></TouchableOpacity>
    <TouchableOpacity style={[styles.sexo, sexo === "macho" && styles.activa]} onPress={() => setSexo("macho")}><Text style={styles.sexoTexto}>Macho</Text></TouchableOpacity>
    <Text style={styles.label}>Fecha de nacimiento</Text><TextInput style={styles.input} placeholder="Opcional · DD/MM/AAAA" value={fechaNacimiento} onChangeText={setFechaNacimiento} />
    <Text style={styles.label}>Nombre</Text><TextInput style={styles.input} placeholder="Opcional" value={nombre} onChangeText={setNombre} />
    <Text style={styles.label}>Raza</Text><TextInput style={styles.input} placeholder="Opcional" value={raza} onChangeText={setRaza} />
    <Text style={styles.label}>Hierro</Text><TouchableOpacity style={[styles.opcion, hierroId === null && styles.activa]} onPress={() => setHierroId(null)}><Text>Sin hierro</Text></TouchableOpacity>
    {hierros.map((h) => <TouchableOpacity key={h.id} style={[styles.opcion, hierroId === h.id && styles.activa]} onPress={() => setHierroId(h.id)}><Text>{h.nombre}</Text></TouchableOpacity>)}
    <Text style={styles.label}>Peso al nacer (kg)</Text><TextInput style={styles.input} keyboardType="decimal-pad" placeholder="Opcional" value={peso} onChangeText={setPeso} />
    <Text style={styles.label}>Foto</Text><AnimalPhotoPicker uri={fotoUri} onChange={setFotoUri} />
    <Text style={styles.label}>Observación</Text><TextInput style={[styles.input, styles.area]} multiline placeholder="Opcional" value={observacion} onChangeText={setObservacion} />
    <TouchableOpacity style={[styles.guardar, guardando && styles.deshabilitado]} disabled={guardando} onPress={guardar}><Text style={styles.guardarTexto}>{guardando ? "Guardando…" : "Registrar cría"}</Text></TouchableOpacity>
  </ScrollView>;
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:"#fff"},contenido:{padding:20,paddingBottom:50},madre:{color:"#2e7d32",fontSize:16,fontWeight:"700"},titulo:{fontSize:28,fontWeight:"700",marginTop:6,marginBottom:8},label:{fontSize:16,fontWeight:"700",marginTop:18,marginBottom:8},ayuda:{color:"#777",marginBottom:8},sexo:{minHeight:58,borderWidth:1,borderColor:"#ddd",borderRadius:12,alignItems:"center",justifyContent:"center",marginBottom:8},sexoTexto:{fontSize:18,fontWeight:"600"},opcion:{minHeight:50,borderWidth:1,borderColor:"#ddd",borderRadius:10,paddingHorizontal:16,justifyContent:"center",marginBottom:8},activa:{borderWidth:2,borderColor:"#2e7d32",backgroundColor:"#e8f5e9"},input:{minHeight:56,borderWidth:1,borderColor:"#ccc",borderRadius:12,paddingHorizontal:16,fontSize:18},area:{minHeight:100,paddingTop:14,textAlignVertical:"top"},guardar:{minHeight:62,backgroundColor:"#2e7d32",borderRadius:12,alignItems:"center",justifyContent:"center",marginTop:28},deshabilitado:{opacity:.5},guardarTexto:{color:"#fff",fontSize:18,fontWeight:"700"},
});
