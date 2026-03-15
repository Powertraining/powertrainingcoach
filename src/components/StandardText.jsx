import { Text } from "react-native";

export default function StandardText({ style, children, ...props }) {
  return (
    <Text style={[{ color: "#fff", fontFamily: "BebasNeue" }, style]} {...props}>
      {children}
    </Text>
  );
}
