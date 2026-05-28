import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";
export default function ProfileSportSelector({
  options = [],
  value = "",
  onChange,
  allowDeselect = true,
}) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.option, isSelected ? styles.optionSelected : null]}
              onPress={() => {
                if (isSelected && !allowDeselect) {
                  return;
                }

                onChange?.(isSelected ? "" : option.value);
              }}
            >
              <Image
                source={option.image}
                style={isSelected ? styles.selectedImage : styles.image}
                resizeMode="contain"
              />
              <IBMPlexText
                numberOfLines={1}
                adjustsFontSizeToFit
                style={isSelected ? styles.selectedText : styles.text}
              >
                {option.label}
              </IBMPlexText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -20,
  },
  content: {
    gap: 8,
    paddingHorizontal: 20,
  },
  option: {
    width: 100,
    height: 100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#1E1E1E",
    backgroundColor: "#141414",
    alignItems: "center",
    justifyContent: "center",
  },
  optionSelected: {
    borderColor: "#ffffff",
  },
  image: {
    width: "58%",
    height: "58%",
    marginBottom: 8,
    tintColor: "#8E8E8E",
  },
  selectedImage: {
    width: "58%",
    height: "58%",
    marginBottom: 8,
    tintColor: "#ffffff",
  },
  text: {
    color: "#8E8E8E",
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 16,
  },
  selectedText: {
    color: "#ffffff",
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 16,
  },
});
