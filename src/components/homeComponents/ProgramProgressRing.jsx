import { View, StyleSheet } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import StandardText from "../textComponents/StandardText.jsx";
import {
    getCurrentTrainingPhase,
    getCurrentTrainingWeek,
} from "../../services/utils/trainingPlan.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const RING_SIZE = 238;
const RING_CENTER = RING_SIZE / 2;
const RING_RADIUS = 101;
const RING_STROKE_WIDTH = 13;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_MIN_MARKER_LENGTH = RING_STROKE_WIDTH * 0.01;

function PowertrainingLogo({ style }) {
    return (
        <Svg
            style={style}
            viewBox="0 0 497 426"
            fill="none"
        >
            <Path d="M226.135 150.142C233.946 142.332 246.609 142.332 254.419 150.142L274.997 170.719C282.807 178.53 282.807 191.193 274.997 199.004L93.2808 380.72C68.7485 405.252 28.9737 405.252 4.44148 380.72C1.98825 378.267 1.98825 374.289 4.44148 371.836L226.135 150.142Z" fill="white" />
            <Path d="M285.073 207.142C292.883 199.332 305.546 199.332 313.357 207.142L331.398 225.183C337.276 231.061 337.276 240.592 331.398 246.47L263.897 313.972C242.394 335.474 207.532 335.474 186.03 313.972C183.88 311.821 183.88 308.335 186.03 306.185L285.073 207.142Z" fill="white" />
            <Path d="M452.088 122.934C454.138 120.884 457.463 120.884 459.514 122.934C480.019 143.44 480.019 176.686 459.514 197.192L446.012 210.694C443.215 213.49 438.682 213.49 435.886 210.694L414.249 189.057C406.438 181.247 406.438 168.584 414.249 160.773L452.088 122.934Z" fill="white" />
            <Rect x="372.084" width="98.2751" height="98.2747" rx="49.1374" transform="rotate(45 372.084 0)" fill="white" />
            <Path d="M206.628 87.1104C204.275 84.7572 204.275 80.942 206.628 78.5888C230.16 55.0572 268.312 55.0571 291.844 78.5888L430.344 217.09C432.698 219.443 432.698 223.258 430.344 225.611C406.813 249.143 368.66 249.143 345.129 225.611L206.628 87.1104Z" fill="white" />
            <Path d="M181.497 181.179C179.486 183.19 176.225 183.19 174.214 181.179C154.105 161.07 154.105 128.467 174.214 108.358L188.33 94.2421C191.121 91.4516 195.645 91.4516 198.435 94.2421L220 115.806C227.42 123.226 227.42 135.256 220 142.676L181.497 181.179Z" fill="white" />
        </Svg>
    );
}

function startOfLocalDay(value = new Date()) {
    const date = value instanceof Date ? new Date(value) : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    date.setHours(0, 0, 0, 0);
    return date;
}

function parseEventDateFromText(value = "") {
    if (typeof value !== "string" || !value.trim()) {
        return null;
    }

    const isoDateMatch = value.match(/\b\d{4}-\d{2}-\d{2}\b/);
    if (isoDateMatch) {
        return startOfLocalDay(`${isoDateMatch[0]}T00:00:00`);
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : startOfLocalDay(parsedDate);
}

function parseRelativeWeeksFromText(value = "") {
    if (typeof value !== "string") {
        return null;
    }

    const relativeWeeksMatch = value.toLowerCase().match(
        /\b(?:in\s*)?(\d{1,2})\s*(?:weeks?|wks?)\s*(?:out|away)?\b/
    );
    const parsedWeeks = relativeWeeksMatch ?
        Number.parseInt(relativeWeeksMatch[1], 10) :
        null;

    return Number.isFinite(parsedWeeks) && parsedWeeks > 0 ? parsedWeeks : null;
}

function getDaysUntil(targetDate) {
    const today = startOfLocalDay();
    const target = startOfLocalDay(targetDate);

    if (!today || !target) {
        return null;
    }

    return Math.max(0, Math.ceil((target - today) / DAY_IN_MS));
}

function getElapsedProgress(startDate, targetDate) {
    const start = startOfLocalDay(startDate);
    const target = startOfLocalDay(targetDate);
    const today = startOfLocalDay();

    if (!start || !target || !today || target <= start) {
        return 0;
    }

    const totalDays = Math.ceil((target - start) / DAY_IN_MS);
    const elapsedDays = Math.ceil((today - start) / DAY_IN_MS);

    return Math.max(0, Math.min(1, elapsedDays / totalDays));
}

function getProgramStartDate(plan = {}) {
    return startOfLocalDay(plan?.createdAt || plan?.generatedAt);
}

function getEventDate(questionnaire = {}, plan = {}) {
    const eventText =
        typeof questionnaire?.competitionTimeline === "string" && questionnaire.competitionTimeline.trim() ?
            questionnaire.competitionTimeline :
            typeof questionnaire?.eventPreparation === "string" ?
                questionnaire.eventPreparation :
                "";
    const eventDate = parseEventDateFromText(eventText);

    if (eventDate) {
        return eventDate;
    }

    const relativeWeeks = parseRelativeWeeksFromText(eventText);
    const programStartDate = getProgramStartDate(plan);

    if (!relativeWeeks || !programStartDate) {
        return null;
    }

    const estimatedEventDate = new Date(programStartDate);
    estimatedEventDate.setDate(estimatedEventDate.getDate() + relativeWeeks * 7);
    return estimatedEventDate;
}

function getCountdownStatus({ questionnaire, plan }) {
    const programStartDate = getProgramStartDate(plan);
    const eventDate = getEventDate(questionnaire, plan);
    const eventDays = eventDate ? getDaysUntil(eventDate) : null;

    if (eventDays !== null) {
        return {
            hasEventDate: true,
            text: `${eventDays} ${eventDays === 1 ? "day" : "days"} until your event`,
            progress: getElapsedProgress(programStartDate, eventDate),
        };
    }

    return {
        hasEventDate: false,
        text: "Powertraining",
        progress: 0,
    };
}

function getCurrentPhaseText(plan, completedDays) {
    if (!plan) {
        return "";
    }

    const currentWeek = getCurrentTrainingWeek(plan, completedDays);
    const currentPhase = getCurrentTrainingPhase(plan, completedDays);
    const phaseLabel = currentPhase?.label || "Building";
    const weekNumber = currentWeek?.week || 1;

    return `${phaseLabel} week ${weekNumber}`;
}

export default function ProgramProgressRing({
    plan,
    questionnaire,
    completedDays,
}) {
    const countdownStatus = getCountdownStatus({ questionnaire, plan });
    const currentPhaseText = getCurrentPhaseText(plan, completedDays);

    if (!countdownStatus.hasEventDate) {
        return (
            <View style={styles.plainStatus}>
                <View style={styles.plainStatusLogoWrap}>
                    <PowertrainingLogo style={styles.plainStatusLogo} />
                </View>
            </View>
        );
    }

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
    plainStatus: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: RING_SIZE,
        overflow: "hidden",
        width: RING_SIZE,
    },
    plainStatusLogo: {
        aspectRatio: 497 / 426,
        width: "100%",
    },
    plainStatusLogoWrap: {
        aspectRatio: 497 / 426,
        width: 156,
    },
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
