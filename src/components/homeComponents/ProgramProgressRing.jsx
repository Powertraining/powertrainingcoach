import { View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

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

function getProgramEndDate(plan = {}) {
    const programStartDate = getProgramStartDate(plan);
    const plannedWeeks = Array.isArray(plan?.weeks) ? plan.weeks.length : 0;

    if (!programStartDate || plannedWeeks <= 0) {
        return null;
    }

    const endDate = new Date(programStartDate);
    endDate.setDate(endDate.getDate() + plannedWeeks * 7);
    return endDate;
}

function getCountdownStatus({ questionnaire, plan }) {
    const programStartDate = getProgramStartDate(plan);
    const eventDate = getEventDate(questionnaire, plan);
    const eventDays = eventDate ? getDaysUntil(eventDate) : null;

    if (eventDays !== null) {
        return {
            text: `${eventDays} ${eventDays === 1 ? "day" : "days"} until your competition`,
            progress: getElapsedProgress(programStartDate, eventDate),
        };
    }

    const programEndDate = getProgramEndDate(plan);
    const programDays = programEndDate ? getDaysUntil(programEndDate) : null;

    if (programDays !== null) {
        return {
            text: `${programDays} ${programDays === 1 ? "day" : "days"} until this program ends`,
            progress: getElapsedProgress(programStartDate, programEndDate),
        };
    }

    return {
        text: "Program in progress",
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
