import { Text, TouchableOpacity, StyleSheet } from "react-native";

export default function QuestionnaireBottomActionButton({ canContinue, onContinue, onBack }) {
    return (
        <TouchableOpacity
            onPress={canContinue ? onContinue : onBack}
            style={canContinue ? styles.continueButton : styles.bottomBackButton}
        >
            <Text style={[styles.buttonText, !canContinue && styles.bottomBackButtonText]}>
                {canContinue ? "Continue" : "Go back"}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    buttonText: {
        fontFamily: "BebasNeue",
        fontSize: 22
    },
    continueButton: {
        color: "#000",
        backgroundColor: "#fff",
        width: "50%",
        margin: "auto",
        height: 60,
        borderRadius: 120,
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        bottom: 0,
        marginBottom: 20,
        alignSelf: "center"
    },
    bottomBackButton: {
        position: "absolute",
        bottom: 0,
        marginBottom: 20,
        alignSelf: "center",
        height: 60,
        justifyContent: "center",
    },
    bottomBackButtonText: {
        color: "#585858"
    },
});
