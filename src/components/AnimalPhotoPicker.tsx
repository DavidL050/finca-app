import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

type Props = { uri: string | null; onChange: (uri: string | null) => void };

export function AnimalPhotoPicker({ uri, onChange }: Props) {
  async function abrirCamara() {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) return Alert.alert("Permiso necesario", "Permite usar la cámara para fotografiar el animal.");
    const resultado = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.75 });
    if (!resultado.canceled) onChange(resultado.assets[0].uri);
  }

  async function abrirGaleria() {
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.75 });
    if (!resultado.canceled) onChange(resultado.assets[0].uri);
  }

  return <View>
    <View style={styles.foto}>{uri ? <Image source={{ uri }} style={styles.imagen} /> : <Ionicons name="camera-outline" size={42} color="#777" />}</View>
    <View style={styles.acciones}>
      <TouchableOpacity style={styles.accion} onPress={abrirCamara}><Ionicons name="camera-outline" size={20} color="#2e7d32" /><Text style={styles.texto}>Tomar foto</Text></TouchableOpacity>
      <TouchableOpacity style={styles.accion} onPress={abrirGaleria}><Ionicons name="images-outline" size={20} color="#2e7d32" /><Text style={styles.texto}>Galería</Text></TouchableOpacity>
    </View>
    {uri ? <TouchableOpacity onPress={() => onChange(null)}><Text style={styles.quitar}>Quitar foto</Text></TouchableOpacity> : null}
  </View>;
}

const styles = StyleSheet.create({
  foto:{width:140,height:140,borderRadius:70,backgroundColor:"#eee",alignSelf:"center",alignItems:"center",justifyContent:"center",overflow:"hidden",marginBottom:12},imagen:{width:"100%",height:"100%"},acciones:{flexDirection:"row",gap:10,justifyContent:"center"},accion:{minHeight:48,borderWidth:1,borderColor:"#b9d8bb",borderRadius:10,paddingHorizontal:14,flexDirection:"row",gap:6,alignItems:"center",justifyContent:"center"},texto:{color:"#2e7d32",fontWeight:"700"},quitar:{color:"#b3261e",textAlign:"center",padding:12},
});
