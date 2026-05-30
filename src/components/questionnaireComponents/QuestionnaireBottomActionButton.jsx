import { useEffect, useRef, useState } from "react";
import { Animated, Easing, TouchableOpacity, View, StyleSheet } from "react-native";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const BUTTON_SLIDE_DISTANCE = 86;
const STACKED_TEXT_SLIDE_DISTANCE = 16;

export default function QuestionnaireBottomActionButton({
    text = "continue",
    canContinue,
    onContinue,
    onBack,
    layout = "single",
    hideWhenDisabled = false,
    hideBack = false,
}) {
    const hidesDisabledSingleButton = layout !== "stacked" && !canContinue && (hideWhenDisabled || hideBack);
    const shouldRenderSingleButton = !hidesDisabledSingleButton;
    const [buttonCanContinue, setButtonCanContinue] = useState(Boolean(canContinue));
    const [stackedText, setStackedText] = useState(text);
    const buttonProgress = useRef(new Animated.Value(shouldRenderSingleButton ? 1 : 0)).current;
    const stackedTextProgress = useRef(new Animated.Value(1)).current;
    const animationIdRef = useRef(0);
    const stackedTextAnimationIdRef = useRef(0);

    useEffect(() => {
        if (layout === "stacked") {
            return;
        }

        animationIdRef.current += 1;
        const animationId = animationIdRef.current;
        buttonProgress.stopAnimation();

        if (shouldRenderSingleButton) {
            setButtonCanContinue(Boolean(canContinue));
            Animated.timing(buttonProgress, {
                toValue: 1,
                duration: 230,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
            return;
        }

        Animated.timing(buttonProgress, {
            toValue: 0,
            duration: 180,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished && animationIdRef.current === animationId) {
                setButtonCanContinue(false);
            }
        });
    }, [buttonProgress, canContinue, layout, shouldRenderSingleButton]);

    useEffect(() => {
        if (layout !== "stacked" || text === stackedText) {
            return;
        }

        stackedTextAnimationIdRef.current += 1;
        const animationId = stackedTextAnimationIdRef.current;
        stackedTextProgress.stopAnimation();

        Animated.timing(stackedTextProgress, {
            toValue: 0,
            duration: 120,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (!finished || stackedTextAnimationIdRef.current !== animationId) {
                return;
            }

            setStackedText(text);
            Animated.timing(stackedTextProgress, {
                toValue: 1,
                duration: 190,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        });
    }, [layout, stackedText, stackedTextProgress, text]);

    if (layout === "stacked") {
        const stackedTextAnimatedStyle = {
            opacity: stackedTextProgress,
            transform: [
                {
                    translateY: stackedTextProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [STACKED_TEXT_SLIDE_DISTANCE, 0],
                    }),
                },
            ],
        };

        return (
            <View style={styles.stackedContainer}>
                {!hideBack ? (
                    <TouchableOpacity onPress={onBack} style={styles.stackedBackButton}>
                        <IBMPlexText style={[styles.buttonText, styles.bottomBackButtonText]}>Back</IBMPlexText>
                    </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={onContinue} style={styles.stackedContinueButton}>
                    <Animated.View style={stackedTextAnimatedStyle}>
                        <IBMPlexText style={styles.buttonText}>{stackedText}</IBMPlexText>
                    </Animated.View>
                </TouchableOpacity>
            </View>
        );
    }

    const animatedButtonStyle = {
        transform: [
            {
                translateY: buttonProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [BUTTON_SLIDE_DISTANCE, 0],
                }),
            },
        ],
    };

    return (
        <AnimatedTouchableOpacity
            onPress={buttonCanContinue ? onContinue : onBack}
            disabled={hidesDisabledSingleButton}
            style={[
                buttonCanContinue ? styles.continueButton : styles.bottomBackButton,
                animatedButtonStyle,
            ]}
        >
            <IBMPlexText style={[styles.buttonText, !buttonCanContinue && styles.bottomBackButtonText]}>
                {buttonCanContinue ? text : "Go back"}
            </IBMPlexText>
        </AnimatedTouchableOpacity>
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
