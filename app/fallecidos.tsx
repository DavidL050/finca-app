import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { listarAnimalesFallecidos, reactivarAnimal } from "../src/services/animalService";

const FINCA_ID = "finca-prueba-1";
type Animal = { id: string; numero: string; nombre: string | null; madre_numero: string | null; raza: string | null; actualizado_en: string; causa_muerte: string | null };

export default function Fallecidos() {
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [procesando, setProcesando] = useState<string | null>(null);
  const cargar = useCallback(async () => setAnimales(await listarAnimalesFallecidos(FINCA_ID) as Animal[]), []);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  function deshacer(animal: Animal) {
    const nombre = animal.numero ? `vaca ${animal.numero}` : `cría de vaca ${animal.madre_numero || ""}`;
    Alert.alert(`Reactivar ${nombre}`, "Se deshará el registro de muerte y volverá al inventario activo.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Reactivar", onPress: async () => {
        if (procesando) return; setProcesando(animal.id);
        try { await reactivarAnimal(animal.id); await cargar(); Alert.alert("Animal reactivado", `${nombre} volvió al inventario.`); }
        catch { Alert.alert("Error", "No fue posible reactivar el animal."); }
        finally { setProcesando(null); }
      } },
    ]);
  }

  return <View style={styles.container}>
    <Stack.Screen options={{ title: "Animales fallecidos" }} /><Text style={styles.titulo}>{animales.length} fallecidos</Text>
    <FlatList data={animales} keyExtractor={(x) => x.id} contentContainerStyle={styles.lista} renderItem={({ item }) => <View style={styles.fila}>
      <View style={styles.datos}><Text style={styles.nombre}>{item.numero ? `Vaca ${item.numero}${item.nombre ? ` · ${item.nombre}` : ""}` : item.nombre || (item.madre_numero ? `Cría de vaca ${item.madre_numero}` : "Animal comprado")}</Text><Text style={styles.detalle}>{item.raza || "Sin raza registrada"}</Text>{item.causa_muerte?<Text style={styles.causa}>Causa: {item.causa_muerte}</Text>:null}<Text style={styles.fecha}>Registrado: {new Date(item.actualizado_en).toLocaleDateString()}</Text></View>
      <TouchableOpacity style={[styles.boton, procesando && styles.deshabilitado]} disabled={procesando !== null} onPress={() => deshacer(item)}><Text style={styles.botonTexto}>{procesando === item.id ? "Activando…" : "Deshacer"}</Text></TouchableOpacity>
    </View>} ListEmptyComponent={<Text style={styles.vacio}>No hay animales fallecidos.</Text>} />
  </View>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:"#fff",padding:20},titulo:{fontSize:26,fontWeight:"700",marginVertical:18},lista:{paddingBottom:30},fila:{flexDirection:"row",alignItems:"center",borderWidth:1,borderColor:"#e1e1e1",borderRadius:14,padding:14,marginBottom:10},datos:{flex:1},nombre:{fontSize:18,fontWeight:"700"},detalle:{color:"#666",marginTop:2},causa:{color:"#b3261e",fontWeight:"600",marginTop:5},fecha:{color:"#888",fontSize:12,marginTop:4},boton:{minHeight:44,borderRadius:10,borderWidth:1,borderColor:"#2e7d32",paddingHorizontal:12,alignItems:"center",justifyContent:"center"},botonTexto:{color:"#2e7d32",fontWeight:"700"},deshabilitado:{opacity:.5},vacio:{textAlign:"center",color:"#888",marginTop:30}});
