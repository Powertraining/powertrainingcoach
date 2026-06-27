import {
  useEffect,
  useRef,
  useState } from "react";
import { View, StyleSheet, PanResponder } from "react-native";
import QuestionnaireShell from "./QuestionnaireShell.jsx";
import QuestionnaireBottomActionButton from "../../components/questionnaireComponents/QuestionnaireBottomActionButton.jsx";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const MIN_SESSIONS = 1;
const MAX_SESSIONS = 5;
const THUMB_SIZE = 24;

export default function QuestionnaireFrequencyView({ value, onChange, onBack, onContinue, onLogoClick, onClose }) {
    const [sliderWidth, setSliderWidth] = useState(0);
    const [dragValue, setDragValue] = useState(value ?? MIN_SESSIONS);
    const activeTouchIdRef = useRef(null);
    const dragStartPageXRef = useRef(0);
    const dragStartValueRef = useRef(value ?? MIN_SESSIONS);
    const dragValueRef = useRef(value ?? MIN_SESSIONS);
    const activeValue = Math.round(dragValue);
    const sliderProgress = (dragValue - MIN_SESSIONS) / (MAX_SESSIONS - MIN_SESSIONS);
    const thumbLeft = sliderWidth ? sliderProgress * (sliderWidth - THUMB_SIZE) : 0;

    useEffect(() => {
        const nextValue = value ?? MIN_SESSIONS;
        dragValueRef.current = nextValue;
        setDragValue(nextValue);
    }, [value]);

    const markers = [];
    for (let i = 1; i <= MAX_SESSIONS; i += 1) {
        markers.push(
            <View key={i} style={styles.numberSlot}>
                <IBMPlexText defaultWhite
                    style={[
                        styles.number,
                        i === activeValue ? styles.numberActive : null,
                    ]}
                    fontSize={i === activeValue ? 24 : 16}
                    textColor={i === activeValue ? "#fff" : "#585858"}
                >
                    {i}
                </IBMPlexText>
            </View>
        );
    }

    function setLiveDragValue(nextValue) {
        dragValueRef.current = nextValue;
        setDragValue(nextValue);
    }

    function commitDragValue(nextValue = dragValueRef.current) {
        const roundedValue = Math.round(nextValue);
        dragValueRef.current = roundedValue;
        setDragValue(roundedValue);
        onChange?.(roundedValue);
    }

    function getResponderTouch(event) {
        const { changedTouches = [], touches = [], identifier } = event.nativeEvent;
        const activeTouchId = activeTouchIdRef.current;
        const allTouches = [...changedTouches, ...touches];

        if (activeTouchId != null) {
            return allTouches.find((touch) => touch.identifier === activeTouchId) || null;
        }

        return allTouches.find((touch) => touch.identifier === identifier) || allTouches[0] || event.nativeEvent;
    }

    function valueFromLocationX(locationX) {
        if (!sliderWidth) {
            return dragValueRef.current;
        }

        const clampedX = Math.min(Math.max(locationX, 0), sliderWidth);
        return MIN_SESSIONS + (clampedX / sliderWidth) * (MAX_SESSIONS - MIN_SESSIONS);
    }

    function valueFromPageX(pageX) {
        if (!sliderWidth) {
            return dragValueRef.current;
        }

        const deltaValue = ((pageX - dragStartPageXRef.current) / sliderWidth) * (MAX_SESSIONS - MIN_SESSIONS);
        return Math.min(
            Math.max(dragStartValueRef.current + deltaValue, MIN_SESSIONS),
            MAX_SESSIONS
        );
    }

    function startDrag(event) {
        const touch = getResponderTouch(event);
        const nextValue = valueFromLocationX(touch?.locationX ?? event.nativeEvent.locationX ?? 0);

        activeTouchIdRef.current = touch?.identifier ?? event.nativeEvent.identifier ?? null;
        dragStartPageXRef.current = touch?.pageX ?? event.nativeEvent.pageX ?? 0;
        dragStartValueRef.current = nextValue;
        setLiveDragValue(nextValue);
    }

    function updateDrag(event) {
        const touch = getResponderTouch(event);

        if (!touch) {
            return;
        }

        setLiveDragValue(valueFromPageX(touch.pageX));
    }

    function endDrag(event) {
        updateDrag(event);
        commitDragValue();
        activeTouchIdRef.current = null;
    }

    const sliderPanResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => activeTouchIdRef.current == null,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: startDrag,
        onPanResponderMove: updateDrag,
        onPanResponderRelease: endDrag,
        onPanResponderTerminate: endDrag,
    });

    return (
        <QuestionnaireShell onLogoClick={onLogoClick} onClose={onClose}>
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.promptArea}>
                        <IBMPlexText titleBlock height={160} style={styles.title}>
                            How many sessions do you want per week?
                        </IBMPlexText>
                    </View>
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
    },
    promptArea: {
        flex: 1,
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
