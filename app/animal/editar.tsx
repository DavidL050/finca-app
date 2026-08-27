import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  actualizarDatosAnimal,
  listarHierros,
  obtenerAnimal,
} from "../../src/services/animalService";
import { AnimalPhotoPicker } from "../../src/components/AnimalPhotoPicker";
import { guardarFotoAnimal } from "../../src/services/photoService";

const FINCA_ID = "finca-prueba-1";
type Hierro = { id: string; nombre: string };
type Animal = { id: string; numero: string; nombre: string | null; raza: string | null; hierro_id: string | null; foto_uri: string | null; madre_numero: string | null };

export default function EditarAnimal() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [raza, setRaza] = useState("");
  const [numero, setNumero] = useState("");
  const [nombre, setNombre] = useState("");
  const [hierroId, setHierroId] = useState<string | null>(null);
  const [hierros, setHierros] = useState<Hierro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [fotoOriginal, setFotoOriginal] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    if (!id) return;
    Promise.all([obtenerAnimal(id), listarHierros(FINCA_ID)]).then(([fila, lista]) => {
      const encontrado = fila as Animal | null;
      setAnimal(encontrado);
      setRaza(encontrado?.raza || "");
      setNumero(encontrado?.numero || "");
      setNombre(encontrado?.nombre || "");
      setHierroId(encontrado?.hierro_id || null);
      setFotoUri(encontrado?.foto_uri || null);
      setFotoOriginal(encontrado?.foto_uri || null);
      setHierros(lista as Hierro[]);
      setCargando(false);
    });
  }, [id]));

  async function guardar() {
    if (!id || guardando) return;
    setGuardando(true);
    try {
      const fotoGuardada = fotoUri && fotoUri !== fotoOriginal ? guardarFotoAnimal(fotoUri) : fotoUri;
      await actualizarDatosAnimal({ animalId: id, numero: numero.trim(), nombre: nombre.trim() || null, raza: raza.trim() || null, hierroId, fotoUri: fotoGuardada });
      Alert.alert("Datos actualizados", "La raza y el hierro quedaron guardados.", [
        { text: "Listo", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "No fue posible actualizar el animal.");
      setGuardando(false);
    }
  }

  if (cargando) return <View style={styles.centrado}><ActivityIndicator size="large" color="#2e7d32" /></View>;
  if (!animal) return <View style={styles.centrado}><Text>No se encontró el animal.</Text></View>;

  return <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>
    <Stack.Screen options={{ title: animal.numero ? `Editar vaca ${animal.numero}` : "Editar cría" }} />
    <Text style={styles.titulo}>{animal.numero ? `Vaca ${animal.numero}` : animal.nombre || (animal.madre_numero ? `Cría de vaca ${animal.madre_numero}` : "Animal comprado")}</Text>
    <AnimalPhotoPicker uri={fotoUri} onChange={setFotoUri} />
    <Text style={styles.label}>Número</Text>
    <TextInput style={styles.input} keyboardType="numeric" placeholder="Sin número" value={numero} onChangeText={setNumero} />
    <Text style={styles.label}>Nombre</Text>
    <TextInput style={styles.input} placeholder="Opcional" value={nombre} onChangeText={setNombre} />
    <Text style={styles.label}>Raza</Text>
    <TextInput style={styles.input} placeholder="Opcional" value={raza} onChangeText={setRaza} />
    <Text style={styles.label}>Hierro</Text>
    <TouchableOpacity style={[styles.opcion, hierroId === null && styles.activa]} onPress={() => setHierroId(null)}><Text>Sin hierro</Text></TouchableOpacity>
    {hierros.map((hierro) => (
      <TouchableOpacity key={hierro.id} style={[styles.opcion, hierroId === hierro.id && styles.activa]} onPress={() => setHierroId(hierro.id)}>
        <Text>{hierro.nombre}</Text>
      </TouchableOpacity>
    ))}
    <TouchableOpacity style={[styles.guardar, guardando && styles.deshabilitado]} disabled={guardando} onPress={guardar}>
      <Text style={styles.guardarTexto}>{guardando ? "Guardando…" : "Guardar cambios"}</Text>
    </TouchableOpacity>
  </ScrollView>;
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:"#fff"},contenido:{padding:20,paddingBottom:40},centrado:{flex:1,alignItems:"center",justifyContent:"center"},titulo:{fontSize:28,fontWeight:"700",marginVertical:18},label:{fontSize:16,fontWeight:"600",marginTop:16,marginBottom:8},input:{minHeight:56,borderWidth:1,borderColor:"#ccc",borderRadius:12,paddingHorizontal:16,fontSize:18},opcion:{minHeight:52,borderWidth:1,borderColor:"#ddd",borderRadius:10,paddingHorizontal:16,justifyContent:"center",marginBottom:8},activa:{borderColor:"#2e7d32",backgroundColor:"#e8f5e9"},guardar:{minHeight:60,backgroundColor:"#2e7d32",borderRadius:12,alignItems:"center",justifyContent:"center",marginTop:26},deshabilitado:{opacity:.5},guardarTexto:{color:"#fff",fontSize:18,fontWeight:"700"},
});
