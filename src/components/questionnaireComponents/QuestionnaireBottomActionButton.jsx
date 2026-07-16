import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const BUTTON_SLIDE_DISTANCE = 86;
const STACKED_TEXT_SLIDE_DISTANCE = 16;
const BUTTON_HORIZONTAL_PADDING = 32;

function estimateContentWidth(text, screenWidth) {
    const estimatedTextWidth = String(text || "").length * 12;
    return Math.min(
        Math.max(148, screenWidth - 40),
        Math.max(148, estimatedTextWidth + BUTTON_HORIZONTAL_PADDING * 2)
    );
}

export default function QuestionnaireBottomActionButton({
    text = "continue",
    canContinue,
    onContinue,
    onBack,
    layout = "single",
    hideWhenDisabled = false,
    hideBack = false,
    animateTextChanges = false,
    contentSized = false,
}) {
    const { width: screenWidth } = useWindowDimensions();
    const hidesDisabledSingleButton = layout !== "stacked" && !canContinue && (hideWhenDisabled || hideBack);
    const shouldRenderSingleButton = !hidesDisabledSingleButton;
    const [buttonCanContinue, setButtonCanContinue] = useState(Boolean(canContinue));
    const [singleText, setSingleText] = useState(text);
    const [stackedText, setStackedText] = useState(text);
    const buttonProgress = useRef(new Animated.Value(shouldRenderSingleButton ? 1 : 0)).current;
    const singleTextProgress = useRef(new Animated.Value(1)).current;
    const singleButtonWidth = useRef(
        new Animated.Value(estimateContentWidth(text, screenWidth))
    ).current;
    const stackedTextProgress = useRef(new Animated.Value(1)).current;
    const animationIdRef = useRef(0);
    const singleTextAnimationIdRef = useRef(0);
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
        if (layout === "stacked" || text === singleText) {
            return;
        }

        if (!animateTextChanges) {
            setSingleText(text);
            return;
        }

        singleTextAnimationIdRef.current += 1;
        const animationId = singleTextAnimationIdRef.current;
        singleTextProgress.stopAnimation();

        Animated.timing(singleTextProgress, {
            toValue: 0,
            duration: 120,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (!finished || singleTextAnimationIdRef.current !== animationId) {
                return;
            }

            setSingleText(text);
            Animated.timing(singleTextProgress, {
                toValue: 1,
                duration: 190,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        });
    }, [animateTextChanges, layout, singleText, singleTextProgress, text]);

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
    const singleTextAnimatedStyle = animateTextChanges
        ? {
            opacity: singleTextProgress,
            transform: [
                {
                    translateY: singleTextProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [STACKED_TEXT_SLIDE_DISTANCE, 0],
                    }),
                },
            ],
        }
        : null;

    function handleMeasuredTextLayout(event) {
        if (!contentSized) {
            return;
        }

        const measuredTextWidth = event.nativeEvent.layout.width;
        const targetWidth = Math.min(
            Math.max(148, screenWidth - 40),
            Math.max(148, Math.ceil(measuredTextWidth) + BUTTON_HORIZONTAL_PADDING * 2)
        );

        singleButtonWidth.stopAnimation();
        Animated.timing(singleButtonWidth, {
            toValue: targetWidth,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }

    const singleButton = (
        <AnimatedTouchableOpacity
            onPress={buttonCanContinue ? onContinue : onBack}
            disabled={hidesDisabledSingleButton}
            style={[
                buttonCanContinue ? styles.continueButton : styles.bottomBackButton,
                animatedButtonStyle,
                contentSized && buttonCanContinue ? styles.contentSizedButton : null,
            ]}
        >
            <Animated.View style={singleTextAnimatedStyle}>
                <IBMPlexText style={[styles.buttonText, !buttonCanContinue && styles.bottomBackButtonText]}>
                    {buttonCanContinue ? singleText : "Go back"}
                </IBMPlexText>
            </Animated.View>
        </AnimatedTouchableOpacity>
    );

    return (
        <>
            {contentSized && buttonCanContinue ? (
                <IBMPlexText
                    onLayout={handleMeasuredTextLayout}
                    pointerEvents="none"
                    style={[styles.buttonText, styles.measurementText]}
                >
                    {text}
                </IBMPlexText>
            ) : null}
            {contentSized && buttonCanContinue ? (
                <Animated.View style={[styles.contentSizedButtonHost, { width: singleButtonWidth }]}>
                    {singleButton}
                </Animated.View>
            ) : singleButton}
        </>
    );
}

const styles = StyleSheet.create({
    buttonText: {
        fontFamily: "IBMPlexSans_600SemiBold",
        fontSize: 22
    },
    measurementText: {
        opacity: 0,
        position: "absolute",
    },
    contentSizedButtonHost: {
        alignSelf: "center",
        bottom: 20,
        height: 60,
        position: "absolute",
    },
    contentSizedButton: {
        alignSelf: "stretch",
        bottom: 0,
        height: "100%",
        margin: 0,
        overflow: "hidden",
        position: "relative",
        width: "100%",
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
