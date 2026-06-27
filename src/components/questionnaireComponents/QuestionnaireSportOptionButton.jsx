import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
} from "react-native";
import { useEffect, useRef } from "react";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";

const OPTION_WIDTH = 127.4;
const OPTION_HEIGHT = 138.2;
const OPTION_FACE_HEIGHT = 125;
const OPTION_INSET = 1.2;
const SELECTED_TRAVEL = 10.8;
const SELECTED_SHADOW_HEIGHT = OPTION_HEIGHT - SELECTED_TRAVEL;
const SELECTED_SHADOW_SCALE = SELECTED_SHADOW_HEIGHT / OPTION_HEIGHT;
const SHADOW_COLOR = "#303030";

export default function QuestionnaireSportOptionButton({ option, isSelected, onPress }) {
    const selectionProgress = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
    const pressScale = useRef(new Animated.Value(1)).current;

    function animateSelection(toValue) {
        selectionProgress.stopAnimation();

        Animated.spring(selectionProgress, {
            toValue,
            damping: 20,
            stiffness: 340,
            mass: 0.62,
            useNativeDriver: true,
        }).start();
    }

    useEffect(() => {
        animateSelection(isSelected ? 1 : 0);
    }, [isSelected, selectionProgress]);

    function handlePressIn() {
        pressScale.stopAnimation();
        Animated.spring(pressScale, {
            toValue: 0.982,
            damping: 22,
            stiffness: 520,
            mass: 0.45,
            useNativeDriver: true,
        }).start();
        onPress?.();
    }

    function handlePressOut() {
        pressScale.stopAnimation();
        Animated.spring(pressScale, {
            toValue: 1,
            damping: 16,
            stiffness: 260,
            mass: 0.75,
            useNativeDriver: true,
        }).start();
    }

    const animatedShadowContainerStyle = {
        transform: [{
            translateY: selectionProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, SELECTED_TRAVEL / 2],
            }),
        }],
    };

    const animatedShadowStyle = {
        transform: [{
            scaleY: selectionProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, SELECTED_SHADOW_SCALE],
            }),
        }],
    };

    const animatedOptionStyle = {
        transform: [
            {
                translateY: selectionProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, SELECTED_TRAVEL],
                }),
            },
            { scale: pressScale },
        ],
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.pressable}
        >
            <Animated.View style={[styles.optionShadowContainer, animatedShadowContainerStyle]}>
                <Animated.View style={[styles.optionShadow, animatedShadowStyle]} />
            </Animated.View>
            <Animated.View style={[styles.option, animatedOptionStyle]}>
                    <Image source={option.image} style={isSelected ? styles.selectedImageStyle : styles.nonSelctedImageStyle} resizeMode="contain" />
                    <IBMPlexText style={isSelected ? styles.optionTextSelected : styles.optionText}>{option.label}</IBMPlexText>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressable: {
        width: OPTION_WIDTH,
        height: OPTION_HEIGHT,
    },
    optionShadowContainer: {
        position: "absolute",
        top: 0,
        right: 0,
        left: 0,
        height: OPTION_HEIGHT,
    },
    optionShadow: {
        width: "100%",
        height: "100%",
        borderRadius: 30,
        backgroundColor: SHADOW_COLOR,
    },
    option: {
        position: "absolute",
        top: OPTION_INSET,
        left: OPTION_INSET,
        right: OPTION_INSET,
        height: OPTION_FACE_HEIGHT,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 28.8,
        backgroundColor: "#0D0D0D",
        alignItems: "center",
        justifyContent: "center"
    },
    nonSelctedImageStyle: {
        width: "60%",
        height: "60%",
        marginBottom: 10,
        tintColor: "#ffffff"
    },
    selectedImageStyle: {
        width: "60%",
        height: "60%",
        marginBottom: 10,
        tintColor: "#fff"
    },
    optionText: {
        color: "#ffffff",
        fontFamily: "IBMPlexSans_600SemiBold",
        fontSize: 20,
    },
    optionTextSelected: {
        color: "#fff",
        fontFamily: "IBMPlexSans_600SemiBold",
        fontSize: 20
    },
});
