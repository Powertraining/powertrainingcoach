import { StyleSheet, Text, View } from "react-native";
import { fonts } from "../../theme/colors.js";

function getFontFamily(style, titleBlock = false) {
  const flattenedStyle = StyleSheet.flatten(style);

  if (titleBlock) {
    return fonts.display;
  }

  if (flattenedStyle?.fontFamily) {
    return flattenedStyle.fontFamily;
  }

  const weight = String(flattenedStyle?.fontWeight || "").toLowerCase();

  if (weight === "700" || weight === "800" || weight === "900" || weight === "bold") {
    return fonts.bodyBold;
  }
  if (weight === "600" || weight === "semibold") {
    return fonts.bodySemiBold;
  }
  if (weight === "500" || weight === "medium") {
    return fonts.bodyMedium;
  }

  return fonts.body;
}

export default function IBMPlexText({
  style,
  lines,
  fontSize,
  center = false,
  textColor,
  defaultWhite = false,
  titleBlock = false,
  height = 280,
  numberOfLines,
  children,
  ...props
}) {
  const resolvedStyle = [
    titleBlock ? { color: "#fff", fontSize: 36, lineHeight: 40, textAlign: "center", fontWeight: "400" } : null,
    defaultWhite || textColor ? { color: textColor ?? "#fff" } : null,
    fontSize ? { fontSize } : null,
    center ? { textAlign: "center", alignSelf: "stretch" } : null,
    style,
  ];

  const text = (
    <Text
      numberOfLines={numberOfLines ?? lines}
      style={[
        resolvedStyle,
        { fontFamily: getFontFamily(resolvedStyle, titleBlock), fontWeight: "400" },
      ]}
      {...props}
    >
      {children}
    </Text>
  );

  if (!titleBlock) {
    return text;
  }

  return (
    <View style={{ width: "82%", maxWidth: 320, alignSelf: "center", height, justifyContent: "center" }}>
      {text}
    </View>
  );
}
