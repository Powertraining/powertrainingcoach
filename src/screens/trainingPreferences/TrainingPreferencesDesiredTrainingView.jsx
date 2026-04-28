import { DESIRED_TRAINING_OPTIONS } from "../../constants/trainingPreferences.js";
import { Image, StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

const DESIRED_TRAINING_LABELS = Object.freeze({
  endurance: "Endurance",
  strength_power: "Strength",
  strength_power_endurance: "Balance",
});

const DESIRED_TRAINING_IMAGES = Object.freeze({
  endurance: [require("../../assets/icons/sports/stamina.png")],
  strength_power: [require("../../assets/icons/sports/strength.png")],
  strength_power_endurance: [require("../../assets/icons/sports/balance.png")],
});

const OPTION_FACE_HEIGHT = 288;
const OPTION_IMAGE_SIZE = OPTION_FACE_HEIGHT * 0.85;

export default function TrainingPreferencesDesiredTrainingView({
  value,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const selectedIndex = DESIRED_TRAINING_OPTIONS.findIndex(
    (option) => option.value === value
  );

  return (
    <View style={[styles.container, { minHeight: screenHeight }]}>
      <TitleText height={110}>What would you like to focus on?</TitleText>

      <View style={styles.options}>
        {DESIRED_TRAINING_OPTIONS.map((option, index) => {
          const isSelected = value === option.value;
          const optionImages = DESIRED_TRAINING_IMAGES[option.value] ?? [];
          const optionImagePositionStyle =
            isSelected || selectedIndex < 0
              ? styles.optionImageRowSelected
              : index < selectedIndex
                ? styles.optionImageRowLeft
                : styles.optionImageRowRight;
          const optionPositionStyle =
            index === 0
              ? styles.optionFaceLeft
              : index === DESIRED_TRAINING_OPTIONS.length - 1
                ? styles.optionFaceRight
                : styles.optionFaceMiddle;

          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange?.(option.value)}
              style={[
                styles.optionButton,
                isSelected ? styles.optionButtonSelected : null,
              ]}
            >
              <View
                style={[
                  styles.optionFace,
                  optionPositionStyle,
                  isSelected ? styles.optionFaceSelected : null,
                ]}
              >
                <View
                  style={[
                    styles.optionImageRow,
                    optionImagePositionStyle,
                  ]}
                >
                  {optionImages.map((imageSource, imageIndex) => (
                    <Image
                      key={`${option.value}-image-${imageIndex}`}
                      source={imageSource}
                      style={[
                        styles.optionImage,
                        index === 1 ? styles.optionImageMiddle : null,
                        option.value === "strength_power"
                          ? styles.optionImageStrength
                          : null,
                      ]}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              </View>
              <StandardText
                style={styles.optionText}
                textColor="#ffffff"
                center
              >
                {DESIRED_TRAINING_LABELS[option.value] ?? option.label}
              </StandardText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  options: {
    width: "100%",
    flexDirection: "row",
    gap: 2,
    marginTop: 36,
  },
  optionButton: {
    flex: 1,
    minHeight: 58,
    position: "relative",
    overflow: "visible",
    alignItems: "center",
  },
  optionButtonSelected: {
    flex:2,
  },
  optionFace: {
    width: "100%",
    minHeight: OPTION_FACE_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    zIndex: 1,
    overflow: "hidden",
  },
  optionImageRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  optionImageRowSelected: {
    width: "100%",
  },
  optionImageRowLeft: {
    transform: [{ translateX: -OPTION_IMAGE_SIZE * 0.05 }],
  },
  optionImageRowRight: {
    transform: [{ translateX: OPTION_IMAGE_SIZE * 0.05 }],
  },
  optionImage: {
    width: OPTION_IMAGE_SIZE,
    height: OPTION_IMAGE_SIZE,
    tintColor: "#000000",
  },
  optionImageStrength: {
    marginTop: -30,
  },
  optionImageMiddle: {
    width: OPTION_IMAGE_SIZE * 0.88,
    height: OPTION_IMAGE_SIZE * 0.88,
  },
  optionFaceLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  optionFaceMiddle: {
    borderRadius: 2,
  },
  optionFaceRight: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  optionFaceSelected: {
    backgroundColor: "#C9B259",
  },
  optionText: {
    width: "100%",
    marginTop: 12,
    fontSize: 17,
    textAlign: "center",
  },
});
