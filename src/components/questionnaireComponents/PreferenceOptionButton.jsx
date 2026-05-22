import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import StandardText from "../textComponents/StandardText.jsx";

export default function PreferenceOptionButton({
  label,
  isSelected,
  onPress,
  imageSource,
  imageStyle,
  mediaText,
  selectedButtonStyle,
  buttonStyle,
  labelStyle,
  mediaTextStyle,
  description,
  descriptionStyle,
  badge,
  badgeStyle,
  badgeTextStyle,
}) {
  const hasDescription = Boolean(description);
  const hasBadge = Boolean(badge);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        hasDescription ? styles.buttonWithDescription : null,
        isSelected ? styles.buttonSelected : null,
        buttonStyle,
        isSelected ? selectedButtonStyle : null,
      ]}
    >
      <View style={styles.content}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={[styles.image, imageStyle]}
            resizeMode="contain"
          />
        ) : mediaText ? (
          <StandardText
            style={[
              styles.mediaText,
              hasDescription ? styles.mediaTextWithDescription : null,
              mediaTextStyle,
            ]}
            textColor="#ffffff"
            center
          >
            {mediaText}
          </StandardText>
        ) : null}
        {hasBadge ? (
          <View style={[styles.badge, badgeStyle]}>
            <Text style={[styles.badgeText, badgeTextStyle]}>{badge}</Text>
          </View>
        ) : null}
        <StandardText
          fontSize={14}
          style={[
            styles.label,
            hasDescription ? styles.labelWithDescription : null,
            labelStyle,
          ]}
          textColor="#ffffff"
          center
        >
          {label}
        </StandardText>
        {hasDescription ? (
          <Text
            numberOfLines={2}
            style={[styles.description, descriptionStyle]}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#121212",
    borderColor: "#2D2D2D",
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    height: 110,
    justifyContent: "center",
    position: "relative",
    width: "75%",
  },
  buttonWithDescription: {
    height: 124,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonSelected: {
    borderColor: "#ffffff",
    borderStyle: "solid",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  badge: {
    alignItems: "center",
    borderColor: "#C9B259",
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 6,
    marginTop: -2,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: "#C9B259",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  image: {
    height: 42,
    marginBottom: 18,
    width: 42,
  },
  mediaText: {
    fontSize: 34,
    marginBottom: 18,
  },
  mediaTextWithDescription: {
    fontSize: 28,
    marginBottom: 8,
  },
  label: {
    bottom: 8,
    position: "absolute",
    width: "100%",
  },
  labelWithDescription: {
    bottom: "auto",
    position: "relative",
  },
  description: {
    color: "#8E8E8E",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
    textAlign: "center",
    width: "100%",
  },
});
