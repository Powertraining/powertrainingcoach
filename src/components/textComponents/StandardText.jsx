import { Text } from "react-native";

export default function StandardText({ style, children, fontSize, center = false, textColor = "#fff", ...props }) {
  return (
    <Text
      style={[
        { color: textColor, fontFamily: "BebasNeue" },
        fontSize ? { fontSize } : null,
        center ? { textAlign: "center", alignSelf: "stretch" } : null,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
