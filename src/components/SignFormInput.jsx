import {View, TextInput, Image } from "react-native";
import StandardText from "./StandardText.jsx";

export default function SignFormInput({text}) {
  return (
    <View>
        <TextInput placeholder="placeholder" placeholderTextColor = "#fff" style={{color: "#fff", borderWidth: 2, borderColor: "#585858", borderRadius: 120, height: 70, marginHorizontal: 20, backgroundColor: "#151515", fontFamily: "BebasNeue", fontSize: 20}}
/>
    </View>
  );
}
