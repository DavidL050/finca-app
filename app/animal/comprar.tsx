import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { router, Stack, useFocusEffect } from "expo-router";
import { AnimalPhotoPicker } from "../../src/components/AnimalPhotoPicker";
import { listarHierros, registrarCompra } from "../../src/services/animalService";
import { guardarFotoAnimal } from "../../src/services/photoService";

const FINCA_ID="finca-prueba-1"; type Hierro={id:string;nombre:string};
export default function ComprarAnimal(){
  const [numero,setNumero]=useState("");const [nombre,setNombre]=useState("");const [raza,setRaza]=useState("");const [hierros,setHierros]=useState<Hierro[]>([]);const [hierroId,setHierroId]=useState<string|null>(null);const [foto,setFoto]=useState<string|null>(null);const [vendedor,setVendedor]=useState("");const [peso,setPeso]=useState("");const [valor,setValor]=useState("");const [guardando,setGuardando]=useState(false);
  useFocusEffect(useCallback(()=>{listarHierros(FINCA_ID).then((x)=>setHierros(x as Hierro[]));},[]));
  async function guardar(){
    if(!vendedor.trim())return Alert.alert("Falta el vendedor","Escribe a quién compraste el animal.");
    const pesoNumero=Number(peso.replace(",","."));if(!Number.isFinite(pesoNumero)||pesoNumero<=0)return Alert.alert("Falta el peso","Escribe el peso de compra en kilogramos.");
    const valorNumero=valor?Number(valor):null;setGuardando(true);
    try{const fotoUri=foto?guardarFotoAnimal(foto):null;const animal=await registrarCompra({fincaId:FINCA_ID,numero:numero.trim(),nombre:nombre.trim()||null,raza:raza.trim()||null,hierroId,fotoUri,vendedor:vendedor.trim(),peso:pesoNumero,valor:valorNumero});router.replace({pathname:"/animal/[id]",params:{id:animal.id}});}
    catch{Alert.alert("Error","No fue posible registrar la compra.");setGuardando(false);}
  }
  return <ScrollView style={styles.container} contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled"><Stack.Screen options={{title:"Registrar compra"}}/><Text style={styles.titulo}>Comprar animal</Text><AnimalPhotoPicker uri={foto} onChange={setFoto}/>
    <Text style={styles.label}>Número en tu finca</Text><TextInput style={styles.input} keyboardType="numeric" placeholder="Opcional · puedes asignarlo después" value={numero} onChangeText={setNumero}/>
    <Text style={styles.label}>Nombre</Text><TextInput style={styles.input} placeholder="Opcional" value={nombre} onChangeText={setNombre}/>
    <Text style={styles.label}>Raza</Text><TextInput style={styles.input} placeholder="Opcional" value={raza} onChangeText={setRaza}/>
    <Text style={styles.label}>Hierro</Text><TouchableOpacity style={[styles.opcion,hierroId===null&&styles.activa]} onPress={()=>setHierroId(null)}><Text>Sin hierro</Text></TouchableOpacity>{hierros.map((h)=><TouchableOpacity key={h.id} style={[styles.opcion,hierroId===h.id&&styles.activa]} onPress={()=>setHierroId(h.id)}><Text>{h.nombre}</Text></TouchableOpacity>)}
    <Text style={styles.label}>Vendedor</Text><TextInput style={styles.input} placeholder="Nombre o empresa" value={vendedor} onChangeText={setVendedor}/>
    <Text style={styles.label}>Peso de compra (kg)</Text><TextInput style={styles.input} keyboardType="decimal-pad" placeholder="Obligatorio" value={peso} onChangeText={setPeso}/>
    <Text style={styles.label}>Valor de compra (COP)</Text><TextInput style={styles.input} keyboardType="numeric" placeholder="$ 0 · Opcional" value={valor?`$ ${Number(valor).toLocaleString("es-CO")}`:""} onChangeText={(x)=>setValor(x.replace(/\D/g,""))}/>
    <TouchableOpacity style={[styles.boton,guardando&&styles.disabled]} disabled={guardando} onPress={guardar}><Text style={styles.botonTexto}>{guardando?"Guardando…":"Registrar compra"}</Text></TouchableOpacity>
  </ScrollView>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:"#fff"},contenido:{padding:20,paddingBottom:50},titulo:{fontSize:28,fontWeight:"700",marginVertical:18},label:{fontSize:16,fontWeight:"700",marginTop:18,marginBottom:8},input:{minHeight:56,borderWidth:1,borderColor:"#ccc",borderRadius:12,paddingHorizontal:16,fontSize:18},opcion:{minHeight:50,borderWidth:1,borderColor:"#ddd",borderRadius:10,paddingHorizontal:16,justifyContent:"center",marginBottom:8},activa:{borderWidth:2,borderColor:"#2e7d32",backgroundColor:"#e8f5e9"},boton:{minHeight:60,backgroundColor:"#2e7d32",borderRadius:12,alignItems:"center",justifyContent:"center",marginTop:28},botonTexto:{color:"#fff",fontSize:18,fontWeight:"700"},disabled:{opacity:.5}});
