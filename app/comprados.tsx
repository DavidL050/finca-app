import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, Stack, useFocusEffect } from "expo-router";
import { listarAnimalesComprados } from "../src/services/animalService";

const FINCA_ID="finca-prueba-1";
type Animal={id:string;numero:string;nombre:string|null;madre_numero:string|null;vendedor:string;peso_compra:number;valor_compra:number|null;fecha_compra:string;estado:string;activo:number};
function nombreAnimal(a:Animal){return a.numero?`Vaca ${a.numero}${a.nombre?` · ${a.nombre}`:""}`:a.nombre||(a.madre_numero?`Cría de vaca ${a.madre_numero}`:"Animal comprado");}
export default function Comprados(){
  const [animales,setAnimales]=useState<Animal[]>([]);const cargar=useCallback(async()=>setAnimales(await listarAnimalesComprados(FINCA_ID) as Animal[]),[]);useFocusEffect(useCallback(()=>{cargar();},[cargar]));
  return <View style={styles.container}><Stack.Screen options={{title:"Animales comprados"}}/><Text style={styles.titulo}>{animales.length} compras</Text><FlatList data={animales} keyExtractor={(x)=>x.id} contentContainerStyle={styles.lista} renderItem={({item})=><TouchableOpacity style={[styles.fila,!item.activo&&styles.inactivo]} disabled={!item.activo} onPress={()=>router.push({pathname:"/animal/[id]",params:{id:item.id}})}>
    <Text style={styles.nombre}>{nombreAnimal(item)}</Text><Text style={styles.vendedor}>Vendedor: {item.vendedor}</Text><Text style={styles.detalle}>{item.peso_compra} kg{item.valor_compra!=null?` · $ ${item.valor_compra.toLocaleString("es-CO")} COP`:""}</Text><View style={styles.pie}><Text style={styles.fecha}>{new Date(item.fecha_compra).toLocaleString()}</Text><Text style={styles.estado}>{item.estado==="activo"?"Activo":item.estado==="vendido"?"Vendido":"Fallecido"}</Text></View>
  </TouchableOpacity>} ListEmptyComponent={<Text style={styles.vacio}>Todavía no hay compras registradas.</Text>}/></View>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:"#fff",padding:20},titulo:{fontSize:26,fontWeight:"700",marginVertical:18},lista:{paddingBottom:30},fila:{borderWidth:1,borderColor:"#e1e1e1",borderRadius:14,padding:16,marginBottom:10},inactivo:{opacity:.65},nombre:{fontSize:18,fontWeight:"700"},vendedor:{color:"#2e7d32",fontWeight:"600",marginTop:6},detalle:{color:"#555",marginTop:4},pie:{flexDirection:"row",justifyContent:"space-between",marginTop:10},fecha:{color:"#888",fontSize:12},estado:{color:"#666",fontSize:12,fontWeight:"700"},vacio:{textAlign:"center",color:"#888",marginTop:30}});
