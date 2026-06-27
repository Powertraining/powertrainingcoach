import { TouchableOpacity, StyleSheet, View } from "react-native";

import BlackGradient from "../colorComponents/BlackGradient.jsx";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";

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
                <IBMPlexText titleBlock height={titleHeight}>Lets start by creating your program</IBMPlexText>
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
                    <IBMPlexText defaultWhite
                        style={[styles.buttonText, circular && styles.circleButtonText]}
                        textColor="#fff"
                    >
                        {label}
                    </IBMPlexText>
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
        borderColor: "#fff",
        borderWidth: 1,
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
