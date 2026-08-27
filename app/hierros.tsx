import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { crearHierro, listarHierros } from "../src/services/animalService";

const FINCA_ID = "finca-prueba-1";
type Hierro = { id: string; nombre: string };

export default function Hierros() {
  const [hierros, setHierros] = useState<Hierro[]>([]);
  const [nombre, setNombre] = useState("");
  const cargar = useCallback(async () => setHierros(await listarHierros(FINCA_ID) as Hierro[]), []);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));
  async function guardar() {
    const limpio = nombre.trim();
    if (!limpio) return Alert.alert("Falta el nombre", "Escribe el nombre del hierro.");
    await crearHierro(FINCA_ID, limpio); setNombre(""); await cargar();
  }
  return <View style={styles.container}>
    <Stack.Screen options={{ title: "Hierros de la finca" }} />
    <Text style={styles.titulo}>Hierros</Text>
    <View style={styles.nuevo}><TextInput style={styles.input} placeholder="Ej. El Roble" value={nombre} onChangeText={setNombre} /><TouchableOpacity style={styles.boton} onPress={guardar}><Text style={styles.botonTexto}>Agregar</Text></TouchableOpacity></View>
    <FlatList data={hierros} keyExtractor={(x) => x.id} renderItem={({ item }) => <View style={styles.fila}><Text style={styles.nombre}>{item.nombre}</Text></View>} ListEmptyComponent={<Text style={styles.vacio}>Aún no has creado hierros.</Text>} />
  </View>;
}
const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:"#fff",padding:20},titulo:{fontSize:28,fontWeight:"700",marginVertical:18},nuevo:{flexDirection:"row",gap:8,marginBottom:22},input:{flex:1,minHeight:54,borderWidth:1,borderColor:"#ccc",borderRadius:12,paddingHorizontal:14,fontSize:17},boton:{backgroundColor:"#2e7d32",borderRadius:12,justifyContent:"center",paddingHorizontal:18},botonTexto:{color:"#fff",fontWeight:"700"},fila:{padding:18,borderWidth:1,borderColor:"#e3e3e3",borderRadius:12,marginBottom:10},nombre:{fontSize:18,fontWeight:"600"},vacio:{textAlign:"center",color:"#888",marginTop:30},
});
