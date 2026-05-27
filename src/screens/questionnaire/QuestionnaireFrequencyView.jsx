import { useEffect, useState } from "react";
import { View, StyleSheet, PanResponder } from "react-native";
import QuestionnaireShell from "./QuestionnaireShell.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx"
import StandardText from "../../components/textComponents/StandardText.jsx"
import QuestionnaireBottomActionButton from "../../components/questionnaireComponents/QuestionnaireBottomActionButton.jsx";

const MIN_SESSIONS = 1;
const MAX_SESSIONS = 5;
const THUMB_SIZE = 24;

export default function QuestionnaireFrequencyView({ value, onChange, onBack, onContinue, onLogoClick, onClose }) {
    const [sliderWidth, setSliderWidth] = useState(0);
    const [dragValue, setDragValue] = useState(value ?? MIN_SESSIONS);
    const activeValue = Math.round(dragValue);
    const sliderProgress = (dragValue - MIN_SESSIONS) / (MAX_SESSIONS - MIN_SESSIONS);
    const thumbLeft = sliderWidth ? sliderProgress * (sliderWidth - THUMB_SIZE) : 0;

    useEffect(() => {
        setDragValue(value ?? MIN_SESSIONS);
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
            onChange?.(roundedValue);
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
                <TitleText height={230} style={styles.title}>
                    How many days per week do you exercise?
                </TitleText>
                <View style={styles.content}>
                    <View style={styles.sliderSection}>
                        <View style={styles.numbers}>
                            {markers}
                        </View>

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
                                    now: activeValue,
                                }}
                                {...sliderPanResponder.panHandlers}
                            />

                            <View style={styles.sliderTrack}>
                                <View style={[styles.sliderTrackFill, { width: `${sliderProgress * 100}%` }]} />
                            </View>

                            <View pointerEvents="none" style={[styles.sliderThumb, { left: thumbLeft }]} />
                        </View>

                        <View style={styles.sliderLabels}>
                            <StandardText style={styles.leftLabel}>Full body</StandardText>
                            <StandardText style={styles.rightLabel}>Precise</StandardText>
                        </View>
                    </View>
                </View>

                <QuestionnaireBottomActionButton
                    layout="stacked"
                    text="Confirm"
                    onContinue={onContinue}
                    onBack={onBack}
                    hideBack
                />
            </View>
        </QuestionnaireShell>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 18,
    },
    title: {
        fontSize: 35,
        lineHeight: 39,
    },
    content: {
        flex: 1,
        paddingBottom: 100,
        justifyContent: "center",
    },
    sliderSection: {
        width: "82%",
        maxWidth: 330,
        alignSelf: "center",
        marginTop: 12,
    },
    sliderShell: {
        width: "100%",
        height: 64,
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
        height: 12,
        top: 24,
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
        top: 18,
        borderRadius: 999,
        backgroundColor: "#fff",
        zIndex: 1,
    },
    sliderLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: THUMB_SIZE / 2,
        marginTop: 2,
    },
    leftLabel: {
        textAlign: "left",
        color: "#7A7A7A",
        fontSize: 16,
        lineHeight: 18,
    },
    rightLabel: {
        textAlign: "right",
        color: "#7A7A7A",
        fontSize: 16,
        lineHeight: 18,
    },
    numbers: {
        width: "100%",
        height: 42,
        alignSelf: "center",
        paddingHorizontal: THUMB_SIZE / 2,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 6,
    },
    numberSlot: {
        width: THUMB_SIZE,
        height: "100%",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    number: {
        textAlign: "center",
        lineHeight: 18,
        includeFontPadding: false,
    },
    numberActive: {
        lineHeight: 28,
    },
});
