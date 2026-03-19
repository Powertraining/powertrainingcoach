import { TouchableOpacity, View} from "react-native";
import StandardText from "./textComponents/StandardText";

export default function LargeSwitch({highlighted, onPress1, onPress2,}) {
  const loginFlex = highlighted === 1 ? 3 : 1;
  const signupFlex = highlighted === 2 ? 3 : 1;

  return (
    <View style={{alignSelf: "stretch", flexDirection: "row",
    backgroundColor: "#151515", alignItems: "center", marginHorizontal: 20, borderRadius: 120, height: 70,
    }}>
    <TouchableOpacity onPress={onPress1}
    
     style={[{ flex: loginFlex, height: "100%", justifyContent: "center", alignItems: "center", 
    borderRadius: 120, },
    highlighted === 1 ? { backgroundColor: "#ffff", } : null
    ]}>
  <StandardText 
  style={[highlighted === 1 ? { color: "#000" } : null, { fontSize: 18 }]}>
  Login
</StandardText>

</TouchableOpacity>

    <TouchableOpacity onPress={onPress2} style={[{ flex: signupFlex, height: "100%", justifyContent: "center", alignItems: "center", 
    borderRadius: 120, },
    highlighted === 2 ? { backgroundColor: "#ffff" } : null
    ]}>
    <StandardText style={[highlighted === 2 ? { color: "#000" } : null, { fontSize: 18 }]}>
  Sign Up
</StandardText>

</TouchableOpacity>
    </View>
  );
}
