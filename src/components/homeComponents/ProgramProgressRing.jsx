import { View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

import StandardText from "../textComponents/StandardText.jsx";
import {
    getCurrentPhaseText,
    getProgramCountdownStatus,
} from "../../services/utils/programProgress.js";

const RING_SIZE = 238;
const RING_CENTER = RING_SIZE / 2;
const RING_RADIUS = 101;
const RING_STROKE_WIDTH = 13;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_MIN_MARKER_LENGTH = RING_STROKE_WIDTH * 0.01;

export default function ProgramProgressRing({
    plan,
    questionnaire,
    completedDays,
}) {
    const countdownStatus = getProgramCountdownStatus({ questionnaire, plan });
    const currentPhaseText = getCurrentPhaseText(plan, completedDays);
    const progressArcLength = Math.max(
        RING_CIRCUMFERENCE * countdownStatus.progress,
        RING_MIN_MARKER_LENGTH
    );
    const progressArcOffset = RING_CIRCUMFERENCE - progressArcLength;

    return (
        <View style={styles.statusRing}>
            <Svg
                style={styles.statusRingArc}
                viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            >
                <Circle
                    cx={RING_CENTER}
                    cy={RING_CENTER}
                    r={RING_RADIUS}
                    fill="none"
                    stroke="#5f5f5f"
                    strokeWidth={RING_STROKE_WIDTH}
                    opacity={0.9}
                />
                <Circle
                    cx={RING_CENTER}
                    cy={RING_CENTER}
                    r={RING_RADIUS}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={RING_STROKE_WIDTH}
                    strokeLinecap="round"
                    strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                    strokeDashoffset={progressArcOffset}
                    rotation="-90"
                    originX={RING_CENTER}
                    originY={RING_CENTER}
                />
            </Svg>
            <View style={styles.statusRingContent}>
                <StandardText style={styles.countdownText} center>
                    {countdownStatus.text}
                </StandardText>
                {currentPhaseText ? (
                    <StandardText style={styles.phaseText} center>
                        {currentPhaseText}
                    </StandardText>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    statusRing: {
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: RING_SIZE / 2,
    },
    statusRingArc: {
        ...StyleSheet.absoluteFillObject,
    },
    statusRingContent: {
        width: 128,
        alignItems: "center",
        justifyContent: "center",
    },
    countdownText: {
        fontSize: 22,
        textAlign: "center",
        lineHeight: 25,
    },
    phaseText: {
        marginTop: 6,
        fontSize: 14,
        textAlign: "center",
        color: "#fff",
    },
});
