import { TouchableOpacity, StyleSheet, View } from "react-native";

import BlackGradient from "../colorComponents/BlackGradient.jsx";
import StandardText from "../textComponents/StandardText.jsx";
import TitleText from "../textComponents/TitleText.jsx";

export default function StartProgramPrompt({
    onStart,
    label = "Continue",
    titleHeight = 280,
    buttonShadowStyle,
    hideTitle = false,
    circular = false,
}) {
    return (
        <>
            {hideTitle ? null : (
                <TitleText height={titleHeight}>Lets start by creating your program</TitleText>
            )}
            <View style={[styles.buttonShadow, buttonShadowStyle]}>
                <TouchableOpacity
                    onPress={onStart}
                    style={[styles.bigButton, circular && styles.circleButton]}
                >
                    <BlackGradient
                        style={{
                            borderRadius: circular ?
                                styles.circleButton.borderRadius :
                                styles.bigButton.borderRadius,
                        }}
                    />
                    <StandardText
                        style={[styles.buttonText, circular && styles.circleButtonText]}
                        textColor="#fff"
                    >
                        {label}
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
    circleButton: {
        borderRadius: 90,
        height: 150,
        minWidth: 0,
        paddingHorizontal: 16,
        width: 150,
    },
    buttonText: {
        fontSize: 24,
        lineHeight: 30,
        textAlign: "center",
    },
    circleButtonText: {
        fontSize: 18,
        lineHeight: 21,
    },
});
