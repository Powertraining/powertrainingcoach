import { Text, TouchableOpacity, View, StyleSheet } from "react-native";

export default function QuestionnaireBottomActionButton({
    text = "continue",
    canContinue,
    onContinue,
    onBack,
    layout = "single",
    showContinue = true,
}) {
    if (layout === "stacked") {
        return (
            <View style={styles.stackedContainer}>
                <TouchableOpacity onPress={onBack} style={styles.stackedBackButton}>
                    <Text style={[styles.buttonText, styles.bottomBackButtonText]}>Back</Text>
                </TouchableOpacity>
                {showContinue ? (
                    <TouchableOpacity onPress={onContinue} style={styles.stackedContinueButton}>
                        <Text style={styles.buttonText}>{text}</Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        );
    }

    return (
        <TouchableOpacity
            onPress={canContinue ? onContinue : onBack}
            style={canContinue ? styles.continueButton : styles.bottomBackButton}
        >
            <Text style={[styles.buttonText, !canContinue && styles.bottomBackButtonText]}>
                {canContinue ? text : "Go back"}
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
