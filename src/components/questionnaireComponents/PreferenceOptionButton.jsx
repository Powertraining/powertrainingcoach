import { Image, StyleSheet, TouchableOpacity } from "react-native";

import StandardText from "../textComponents/StandardText.jsx";

export default function PreferenceOptionButton({
  label,
  isSelected,
  onPress,
  imageSource,
  imageStyle,
  mediaText,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        isSelected ? styles.buttonSelected : null,
      ]}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={[styles.image, imageStyle]}
          resizeMode="contain"
        />
      ) : mediaText ? (
        <StandardText
          style={styles.mediaText}
          textColor={isSelected ? "#000000" : "#ffffff"}
          center
        >
          {mediaText}
        </StandardText>
      ) : null}
      <StandardText
        fontSize={14}
        style={styles.label}
        textColor={isSelected ? "#000000" : "#ffffff"}
        center
      >
        {label}
      </StandardText>
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
  buttonSelected: {
    backgroundColor: "#ffffff",
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
  label: {
    bottom: 8,
    position: "absolute",
    width: "100%",
  },
});
