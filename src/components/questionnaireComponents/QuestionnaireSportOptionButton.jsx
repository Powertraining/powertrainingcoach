import { Image, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function QuestionnaireSportOptionButton({ option, isSelected, onPress }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.option, isSelected && styles.optionSelected]}
        >
            <Image source={option.image} style={isSelected ? styles.selectedImageStyle : styles.nonSelctedImageStyle} resizeMode="contain" />
            <Text style={isSelected ? styles.optionTextSelected : styles.optionText}>{option.label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    option: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 30,
        borderWidth: 1.2,
        borderColor: "#585858",
        borderStyle: "dashed",
        color: "#585858",
        width: 125,
        height: 125,
        backgroundColor: "#1E1E1E",
        alignItems: "center",
        justifyContent: "center"
    },
    nonSelctedImageStyle: {
        width: "60%",
        height: "60%",
        marginBottom: 10,
        tintColor: "#8E8E8E"
    },
    selectedImageStyle: {
        width: "60%",
        height: "60%",
        marginBottom: 10,
        tintColor: "#000"
    },
    optionSelected: {
        backgroundColor: "#fff",
        borderStyle: "solid",
    },
    optionText: {
        color: "#8E8E8E",
        fontFamily: "BebasNeue",
        fontSize: 20,
    },
    optionTextSelected: {
        color: "#000",
        fontFamily: "BebasNeue",
        fontSize: 20
    },
});
