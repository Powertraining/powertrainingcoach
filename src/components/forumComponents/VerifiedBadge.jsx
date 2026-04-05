import { Image, StyleSheet, View } from "react-native";
import GoldGradient from "../colorComponents/GoldGradient.jsx";

export default function VerifiedBadge() {
  return (
    <View style={styles.verifiedBadge}>
      <GoldGradient />
      <Image
        source={require("../../assets/icons/check.png")}
        style={styles.verifiedIcon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 120,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedIcon: {
    width: 9,
    height: 9,
    tintColor: "#000",
  },
});
