import { TouchableOpacity, StyleSheet, View } from "react-native";

import GoldGradient from "../colorComponents/GoldGradient.jsx";
import StandardText from "../textComponents/StandardText.jsx";
import TitleText from "../textComponents/TitleText.jsx";

export default function StartProgramPrompt({ onStart }) {
    return (
        <>
            <TitleText>Lets start by creating your program</TitleText>
            <View style={styles.buttonShadow}>
                <TouchableOpacity onPress={onStart} style={styles.bigButton}>
                    <GoldGradient style={{ borderRadius: styles.bigButton.borderRadius }} />
                    <StandardText textColor="#fff" fontSize={36}>Start</StandardText>
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
        backgroundColor: "#fff",
        height: 75,
        paddingHorizontal: 70,
        borderRadius: 120,
        alignItems: "center",
        justifyContent: "center",
    },
});
