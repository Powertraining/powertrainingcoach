import {
  Image,
  TouchableOpacity,
  StyleSheet,
  View,
} from "react-native";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";
export default function QuestionnaireSportOptionButton({ option, isSelected, onPress }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.82}
            style={[styles.optionBorder, isSelected && styles.optionBorderSelected]}
        >
            <View style={styles.option}>
                <Image source={option.image} style={isSelected ? styles.selectedImageStyle : styles.nonSelctedImageStyle} resizeMode="contain" />
                <IBMPlexText style={isSelected ? styles.optionTextSelected : styles.optionText}>{option.label}</IBMPlexText>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    optionBorder: {
        borderRadius: 30,
        paddingTop: 1.2,
        paddingRight: 1.2,
        paddingBottom: 12,
        paddingLeft: 1.2,
        width: 127.4,
        height: 138.2,
        backgroundColor: "#303030",
    },
    option: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 28.8,
        backgroundColor: "#0D0D0D",
        alignItems: "center",
        justifyContent: "center"
    },
    nonSelctedImageStyle: {
        width: "60%",
        height: "60%",
        marginBottom: 10,
        tintColor: "#ffffff"
    },
    selectedImageStyle: {
        width: "60%",
        height: "60%",
        marginBottom: 10,
        tintColor: "#fff"
    },
    optionBorderSelected: {
        height: 127.4,
        paddingBottom: 1.2,
        transform: [{ translateY: 10.8 }],
    },
    optionText: {
        color: "#ffffff",
        fontFamily: "IBMPlexSans_600SemiBold",
        fontSize: 20,
    },
    optionTextSelected: {
        color: "#fff",
        fontFamily: "IBMPlexSans_600SemiBold",
        fontSize: 20
    },
});
