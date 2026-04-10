import { Text } from "react-native";

export default function StandardText({ lines = undefined, style, children, fontSize, center = false, textColor = "#fff", ...props }) {
  return (
    <Text numberOfLines={lines}
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
