import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import StandardText from "../../components/textComponents/StandardText";

export default function AuthNavbar({ onTabChange, onSubmitLogin, onSubmitSignup }) {
  const [active, setActive] = useState(1);

  function pressLoginACB() {
    if (active === 1) {
      onSubmitLogin?.();
    } else {
      setActive(1);
      onTabChange(1);
    }
  }

  function pressSignupACB() {
    if (active === 2) {
      onSubmitSignup?.();
    } else {
      setActive(2);
      onTabChange(2);
    }
  }

  return (
    <View style={{ alignSelf: "stretch", flexDirection: "row",
      backgroundColor: "#151515", alignItems: "center", marginHorizontal: 20, borderRadius: 120, height: 70,
    }}>
      <TouchableOpacity onPress={pressLoginACB}
        style={[{ flex: active === 1 ? 3 : 1, height: "100%", justifyContent: "center", alignItems: "center", borderRadius: 120 },
          active === 1 ? { backgroundColor: "#ffff" } : null
        ]}>
        <StandardText style={[active === 1 ? { color: "#000" } : null, { fontSize: 18 }]}>
          Login
        </StandardText>
      </TouchableOpacity>

      <TouchableOpacity onPress={pressSignupACB}
        style={[{ flex: active === 2 ? 3 : 1, height: "100%", justifyContent: "center", alignItems: "center", borderRadius: 120 },
          active === 2 ? { backgroundColor: "#ffff" } : null
        ]}>
        <StandardText style={[active === 2 ? { color: "#000" } : null, { fontSize: 18 }]}>
          Sign Up
        </StandardText>
      </TouchableOpacity>
    </View>
  );
}
