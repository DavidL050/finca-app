import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { crearAnimal, listarHierros } from "../../src/services/animalService";
import { AnimalPhotoPicker } from "../../src/components/AnimalPhotoPicker";
import { guardarFotoAnimal } from "../../src/services/photoService";

const FINCA_ID = "finca-prueba-1";
type Hierro = { id: string; nombre: string };
export default function NuevoAnimal() {
  const { numero: inicial = "" } = useLocalSearchParams<{ numero?: string }>();
  const [numero, setNumero] = useState(inicial);
  const [raza, setRaza] = useState(""); const [hierros, setHierros] = useState<Hierro[]>([]);
  const [nombre, setNombre] = useState("");
  const [hierroId, setHierroId] = useState<string | null>(null); const [guardando, setGuardando] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  useFocusEffect(useCallback(() => { listarHierros(FINCA_ID).then((x) => setHierros(x as Hierro[])); }, []));
  async function guardar() {
    if (!numero.trim()) return Alert.alert("Falta el número", "Escribe el número del animal.");
    setGuardando(true);
    try { const fotoGuardada = fotoUri ? guardarFotoAnimal(fotoUri) : null; const animal = await crearAnimal({ fincaId: FINCA_ID, numero: numero.trim(), nombre: nombre.trim() || null, raza: raza.trim() || null, hierroId, fotoUri: fotoGuardada }); router.replace({ pathname: "/animal/[id]", params: { id: animal.id } }); }
    catch { Alert.alert("Error", "No fue posible registrar el animal."); setGuardando(false); }
  }
  return <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>
    <Stack.Screen options={{ title: "Registrar animal" }} /><Text style={styles.titulo}>Nuevo animal</Text>
    <AnimalPhotoPicker uri={fotoUri} onChange={setFotoUri} />
    <Text style={styles.label}>Número</Text><TextInput style={styles.input} keyboardType="numeric" value={numero} onChangeText={setNumero} />
    <Text style={styles.label}>Nombre</Text><TextInput style={styles.input} placeholder="Opcional" value={nombre} onChangeText={setNombre} />
    <Text style={styles.label}>Raza</Text><TextInput style={styles.input} placeholder="Opcional" value={raza} onChangeText={setRaza} />
    <Text style={styles.label}>Hierro</Text><TouchableOpacity style={[styles.opcion,hierroId===null&&styles.activa]} onPress={()=>setHierroId(null)}><Text>Sin hierro</Text></TouchableOpacity>
    {hierros.map((h)=><TouchableOpacity key={h.id} style={[styles.opcion,hierroId===h.id&&styles.activa]} onPress={()=>setHierroId(h.id)}><Text>{h.nombre}</Text></TouchableOpacity>)}
    <TouchableOpacity style={[styles.guardar,guardando&&{opacity:.5}]} disabled={guardando} onPress={guardar}><Text style={styles.guardarTexto}>{guardando?"Guardando…":"Registrar animal"}</Text></TouchableOpacity>
  </ScrollView>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:"#fff"},contenido:{padding:20,paddingBottom:40},titulo:{fontSize:28,fontWeight:"700",marginVertical:18},label:{fontSize:16,fontWeight:"600",marginTop:16,marginBottom:8},input:{minHeight:56,borderWidth:1,borderColor:"#ccc",borderRadius:12,paddingHorizontal:16,fontSize:18},opcion:{minHeight:52,borderWidth:1,borderColor:"#ddd",borderRadius:10,paddingHorizontal:16,justifyContent:"center",marginBottom:8},activa:{borderColor:"#2e7d32",backgroundColor:"#e8f5e9"},guardar:{minHeight:60,backgroundColor:"#2e7d32",borderRadius:12,alignItems:"center",justifyContent:"center",marginTop:26},guardarTexto:{color:"#fff",fontSize:18,fontWeight:"700"}});
