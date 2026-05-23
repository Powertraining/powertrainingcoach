import { TouchableOpacity, StyleSheet, View } from "react-native";

import BlackGradient from "../colorComponents/BlackGradient.jsx";
import StandardText from "../textComponents/StandardText.jsx";
import TitleText from "../textComponents/TitleText.jsx";

export default function StartProgramPrompt({ onStart }) {
    return (
        <>
            <TitleText>Lets start by creating your program</TitleText>
            <View style={styles.buttonShadow}>
                <TouchableOpacity onPress={onStart} style={styles.bigButton}>
                    <BlackGradient style={{ borderRadius: styles.bigButton.borderRadius }} />
                    <StandardText style={styles.buttonText} textColor="#fff">
                        Continue
                    </StandardText>
                </TouchableOpacity>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    buttonShadow: {
        alignSelf: "center",
        marginTop: 20,
        marginBottom: 120,
        borderRadius: 120,
        boxShadow: "0px 0px 100px -25px #fff",
    },
    bigButton: {
        backgroundColor: "#000",
        height: 75,
        paddingHorizontal: 32,
        borderRadius: 120,
        alignItems: "center",
        justifyContent: "center",
        minWidth: 280,
        overflow: "hidden",
    },
    buttonText: {
        fontSize: 24,
        lineHeight: 30,
        textAlign: "center",
    },
});
