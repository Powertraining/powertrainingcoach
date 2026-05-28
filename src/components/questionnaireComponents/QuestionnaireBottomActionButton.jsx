import { TouchableOpacity, View, StyleSheet } from "react-native";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";
export default function QuestionnaireBottomActionButton({
    text = "continue",
    canContinue,
    onContinue,
    onBack,
    layout = "single",
    hideWhenDisabled = false,
    hideBack = false,
}) {
    if (layout === "stacked") {
        return (
            <View style={styles.stackedContainer}>
                {!hideBack ? (
                    <TouchableOpacity onPress={onBack} style={styles.stackedBackButton}>
                        <IBMPlexText style={[styles.buttonText, styles.bottomBackButtonText]}>Back</IBMPlexText>
                    </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={onContinue} style={styles.stackedContinueButton}>
                    <IBMPlexText style={styles.buttonText}>{text}</IBMPlexText>
                </TouchableOpacity>
            </View>
        );
    }

    if (!canContinue && (hideWhenDisabled || hideBack)) {
        return null;
    }

    return (
        <TouchableOpacity
            onPress={canContinue ? onContinue : onBack}
            style={canContinue ? styles.continueButton : styles.bottomBackButton}
        >
            <IBMPlexText style={[styles.buttonText, !canContinue && styles.bottomBackButtonText]}>
                {canContinue ? text : "Go back"}
            </IBMPlexText>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    buttonText: {
        fontFamily: "IBMPlexSans_600SemiBold",
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
    stackedContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        marginBottom: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    stackedBackButton: {
        height: 60,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    stackedContinueButton: {
        color: "#000",
        backgroundColor: "#fff",
        width: "50%",
        height: 60,
        borderRadius: 120,
        alignItems: "center",
        justifyContent: "center",
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
