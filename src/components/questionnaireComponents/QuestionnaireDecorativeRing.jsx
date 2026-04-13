import { View, StyleSheet } from "react-native";

export default function QuestionnaireDecorativeRing({ style }) {
    return <View style={[styles.decorativeCircle, style]} />;
}

const styles = StyleSheet.create({
    decorativeCircle: {
        position: "absolute",
        top: -95,
        left: -95,
        width: 190,
        aspectRatio: 1,
        borderRadius: 10000,
        borderWidth: 5,
        borderColor: "#fff",
    }
});
