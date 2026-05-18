import { useEffect, useState } from "react";
import { View, StyleSheet, PanResponder } from "react-native";
import QuestionnaireShell from "./QuestionnaireShell.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx"
import StandardText from "../../components/textComponents/StandardText.jsx"
import QuestionnaireBottomActionButton from "../../components/questionnaireComponents/QuestionnaireBottomActionButton.jsx";

const MIN_SESSIONS = 1;
const MAX_SESSIONS = 5;
const THUMB_SIZE = 24;
const SLIDER_TOUCH_HEIGHT = 90;

export default function QuestionnaireFrequencyView({ value, onChange, onBack, onContinue, onLogoClick, onClose }) {
    const [sliderWidth, setSliderWidth] = useState(0);
    const [dragValue, setDragValue] = useState(value);
    const activeValue = Math.round(dragValue);
    const sliderProgress = (dragValue - MIN_SESSIONS) / (MAX_SESSIONS - MIN_SESSIONS);
    const thumbLeft = sliderWidth ? sliderProgress * (sliderWidth - THUMB_SIZE) : 0;

    useEffect(() => {
        setDragValue(value);
    }, [value]);

    const markers = [];
    for (let i = 1; i <= MAX_SESSIONS; i += 1) {
        markers.push(
            <View key={i} style={styles.numberSlot}>
                <StandardText
                    style={[
                        styles.number,
                        i === activeValue ? styles.numberActive : null,
                    ]}
                    fontSize={i === activeValue ? 24 : 16}
                    textColor={i === activeValue ? "#fff" : "#585858"}
                >
                    {i}
                </StandardText>
            </View>
        );
    }

    function updateValueFromTouch(locationX, shouldCommit = false) {
        if (!sliderWidth) {
            return;
        }

        const clampedX = Math.min(Math.max(locationX, 0), sliderWidth);
        const rawValue = MIN_SESSIONS + (clampedX / sliderWidth) * (MAX_SESSIONS - MIN_SESSIONS);

        if (shouldCommit) {
            const roundedValue = Math.round(rawValue);
            setDragValue(roundedValue);
            onChange(roundedValue);
            return;
        }

        setDragValue(rawValue);
    }

    const sliderPanResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
            updateValueFromTouch(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
            updateValueFromTouch(event.nativeEvent.locationX);
        },
        onPanResponderRelease: (event) => {
            updateValueFromTouch(event.nativeEvent.locationX, true);
        },
        onPanResponderTerminate: (event) => {
            updateValueFromTouch(event.nativeEvent.locationX, true);
        },
    });

    return (
        <QuestionnaireShell onLogoClick={onLogoClick} onClose={onClose}>
            <View style={styles.container}>
                <TitleText>How many strength sessions per week do you do?</TitleText>
                
                <View style={styles.numbers}>
                    {markers}
                </View>

                <View style={styles.content}>

                    <View style={styles.sliderSection}>
                        <View
                            style={styles.sliderShell}
                            onLayout={({ nativeEvent }) => setSliderWidth(nativeEvent.layout.width)}
                        >
                            <View
                                style={styles.sliderTouchArea}
                                accessibilityRole="adjustable"
                                accessibilityValue={{
                                    min: MIN_SESSIONS,
                                    max: MAX_SESSIONS,
                                    now: Math.round(dragValue),
                                }}
                                {...sliderPanResponder.panHandlers}
                            />

                            <View style={styles.sliderTrack}>
                                <View style={[styles.sliderTrackFill, { width: `${sliderProgress * 100}%` }]} />
                            </View>

                            <View pointerEvents="none" style={[styles.sliderThumb, { left: thumbLeft }]} />
                        </View>

                        <View style={styles.sliderLabels}>
                            <StandardText style={styles.leftLable}>Full body</StandardText>
                            <StandardText style={styles.rightLable}>Precise</StandardText>
                        </View>
                    </View>
                     
                </View>

                <QuestionnaireBottomActionButton layout="stacked" text="Confirm" onContinue={onContinue} onBack={onBack} />
            </View>
        </QuestionnaireShell>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 20,
    },
    content: {
        paddingBottom: 100,
    },
    sliderSection: {
        width: "80%",
        alignSelf: "center",
        marginTop: 8,
    },
    sliderShell: {
        width: "100%",
        height: SLIDER_TOUCH_HEIGHT,
        position: "relative",
    },
    sliderTouchArea: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 2,
    },
    sliderTrack: {
        position: "absolute",
        left: THUMB_SIZE / 2,
        right: THUMB_SIZE / 2,
        height: 15,
        top: 12,
        borderRadius: 999,
        backgroundColor: "#2A2A2A",
        overflow: "hidden",
    },
    sliderTrackFill: {
        height: "100%",
        borderRadius: 999,
        backgroundColor: "#fff",
    },
    sliderThumb: {
        position: "absolute",
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        top: 8,
        borderRadius: 999,
        backgroundColor: "#fff",
        zIndex: 1,
    },
    sliderLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: -4,
    },
    leftLable: {
        textAlign: "left",
        marginLeft: 20,
        bottom: 40,
    },
    rightLable: {
        textAlign: "right",
        marginRight: 20,
        bottom: 40,
    },
    numbers: {
        width: "80%",
        height: 34,
        alignSelf: "center",
        paddingHorizontal: THUMB_SIZE / 2,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    numberSlot: {
        width: THUMB_SIZE,
        height: "100%",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    number: {
        textAlign: "center",
        lineHeight: 16,
        includeFontPadding: false,
    },
    numberActive: {
        lineHeight: 24,
    },
});
