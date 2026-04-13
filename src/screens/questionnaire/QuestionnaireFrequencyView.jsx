import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import QuestionnaireShell from "./QuestionnaireShell.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx"
import StandardText from "../../components/textComponents/StandardText.jsx"
import QuestionnaireBottomActionButton from "../../components/questionnaireComponents/QuestionnaireBottomActionButton.jsx";

const MIN_SESSIONS = 1;
const MAX_SESSIONS = 5;
const THUMB_SIZE = 24;

export default function QuestionnaireFrequencyView({ value, onChange, onBack, onContinue, onLogoClick }) {
    const [sliderWidth, setSliderWidth] = useState(0);
    const [dragValue, setDragValue] = useState(value);
    const sliderProgress = (dragValue - MIN_SESSIONS) / (MAX_SESSIONS - MIN_SESSIONS);
    const thumbLeft = sliderWidth ? sliderProgress * (sliderWidth - THUMB_SIZE) : 0;

    useEffect(() => {
        setDragValue(value);
    }, [value]);

    return (
        <QuestionnaireShell onLogoClick={onLogoClick}>
            <View style={styles.container}>
                <TitleText>How many strength sessions per week do you do?</TitleText>

                <View style={styles.content}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <StandardText>total body, comprehensive</StandardText>
                        <StandardText>more divided, scattered</StandardText>
                    </View>

                    <View
                        style={styles.sliderShell}
                        onLayout={({ nativeEvent }) => setSliderWidth(nativeEvent.layout.width)}
                    >
                        <View style={styles.sliderTrack}>
                            <View style={[styles.sliderTrackFill, { width: `${sliderProgress * 100}%` }]} />
                        </View>

                        <View pointerEvents="none" style={[styles.sliderThumb, { left: thumbLeft }]} />

                        <Slider
                            minimumValue={MIN_SESSIONS}
                            maximumValue={MAX_SESSIONS}
                            value={dragValue}
                            onValueChange={(v) => setDragValue(v)}
                            onSlidingComplete={(v) => {
                                const roundedValue = Math.round(v);
                                setDragValue(roundedValue);
                                onChange(roundedValue);
                            }}
                            minimumTrackTintColor="transparent"
                            maximumTrackTintColor="transparent"
                            thumbTintColor="transparent"
                            style={styles.slider}
                        />
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
    sliderShell: {
        width: "80%",
        alignSelf: "center",
        height: 40,
        justifyContent: "center",
        marginTop: 8,
    },
    sliderTrack: {
        position: "absolute",
        left: THUMB_SIZE / 2,
        right: THUMB_SIZE / 2,
        height: 15,
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
        borderRadius: 999,
        backgroundColor: "#fff",
        zIndex: 1,
    },
    slider: {
        width: "100%",
        height: 40,
    },
});
