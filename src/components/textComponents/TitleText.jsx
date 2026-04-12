import { View, Text } from "react-native";

export default function TitleText({ style, children, height = 280, ...props }) {
  return (
    <View
      style={{ width: 175, alignSelf: "center", height: height, justifyContent: "center" }}
    >
      <Text
        style={[{ color: "#fff", fontFamily: "BebasNeue", fontSize: 36, textAlign: "center"}, style]}
        {...props}
      >
        {children}
      </Text>
    </View>
  );
}
