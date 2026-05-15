import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileSportSelector({
  options = [],
  value = "",
  onChange,
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
              onPress={() => onChange?.(isSelected ? "" : option.value)}
            >
              <Image
                source={option.image}
                style={isSelected ? styles.selectedImage : styles.image}
                resizeMode="contain"
              />
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={isSelected ? styles.selectedText : styles.text}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginHorizontal: -20,
  },
  content: {
    gap: 12,
    paddingHorizontal: 20,
  },
  option: {
    width: 100,
    height: 100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#585858",
    borderStyle: "dashed",
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
  },
  optionSelected: {
    backgroundColor: "#ffffff",
    borderStyle: "solid",
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
    tintColor: "#000000",
  },
  text: {
    color: "#8E8E8E",
    fontFamily: "BebasNeue",
    fontSize: 16,
  },
  selectedText: {
    color: "#000000",
    fontFamily: "BebasNeue",
    fontSize: 16,
  },
});
