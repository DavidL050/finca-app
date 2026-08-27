import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { registrarEnfermedad } from "../../src/services/animalService";

export default function Enfermedad() {
  const params = useLocalSearchParams<{ animalId: string | string[]; numero?: string }>();
  const animalId = Array.isArray(params.animalId) ? params.animalId[0] : params.animalId;
  const [diagnostico, setDiagnostico] = useState(""); const [tratamiento, setTratamiento] = useState(""); const [evolucion, setEvolucion] = useState(""); const [guardando, setGuardando] = useState(false);
  async function guardar() {
    if (!diagnostico.trim()) return Alert.alert("Falta el diagnóstico", "Describe la enfermedad o los síntomas observados.");
    if (!animalId || guardando) return; setGuardando(true);
    try { await registrarEnfermedad({ animalId, diagnostico: diagnostico.trim(), tratamiento: tratamiento.trim() || null, evolucion: evolucion.trim() || null }); Alert.alert("Enfermedad registrada", "Podrás agregar nuevas evoluciones desde el historial.", [{ text: "Listo", onPress: () => router.back() }]); }
    catch { Alert.alert("Error", "No fue posible guardar el diagnóstico."); setGuardando(false); }
  }
  return <ScrollView style={styles.container} contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
    <Stack.Screen options={{ title: "Registrar enfermedad" }} /><Text style={styles.animal}>Vaca {params.numero || ""}</Text><Text style={styles.titulo}>Enfermedad</Text>
    <Text style={styles.label}>Diagnóstico o síntomas</Text><TextInput style={[styles.input,styles.area]} multiline placeholder="Obligatorio" value={diagnostico} onChangeText={setDiagnostico} />
    <Text style={styles.label}>Tratamiento</Text><TextInput style={[styles.input,styles.area]} multiline placeholder="Opcional · medicamento, dosis o cuidados" value={tratamiento} onChangeText={setTratamiento} />
    <Text style={styles.label}>Evolución inicial</Text><TextInput style={[styles.input,styles.area]} multiline placeholder="Opcional" value={evolucion} onChangeText={setEvolucion} />
    <TouchableOpacity style={[styles.boton,guardando&&styles.disabled]} disabled={guardando} onPress={guardar}><Text style={styles.botonTexto}>{guardando?"Guardando…":"Guardar enfermedad"}</Text></TouchableOpacity>
  </ScrollView>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:"#fff"},contenido:{padding:20,paddingBottom:40},animal:{color:"#2e7d32",fontSize:16,fontWeight:"700"},titulo:{fontSize:28,fontWeight:"700",marginTop:6},label:{fontSize:16,fontWeight:"700",marginTop:22,marginBottom:8},input:{borderWidth:1,borderColor:"#ccc",borderRadius:12,padding:14,fontSize:17},area:{minHeight:110,textAlignVertical:"top"},boton:{minHeight:60,backgroundColor:"#2e7d32",borderRadius:12,alignItems:"center",justifyContent:"center",marginTop:28},botonTexto:{color:"#fff",fontSize:18,fontWeight:"700"},disabled:{opacity:.5}});
