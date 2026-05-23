import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import StandardText from "../../components/textComponents/StandardText.jsx";
import Dotted from "../../components/colorComponents/Dotted.jsx";
import ProgramProgressRing from "../../components/homeComponents/ProgramProgressRing.jsx";
import StartProgramPrompt from "../../components/homeComponents/StartProgramPrompt.jsx";
import ProfileNavigationCard from "../../components/profileComponents/ProfileNavigationCard.jsx";

const SESSION_PROGRESS_RING_SIZE = 58;
const SESSION_PROGRESS_RING_CENTER = SESSION_PROGRESS_RING_SIZE / 2;
const SESSION_PROGRESS_RING_RADIUS = 22;
const SESSION_PROGRESS_RING_STROKE = 6;
const SESSION_PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * SESSION_PROGRESS_RING_RADIUS;
const WEEKDAY_NAMES = Object.freeze([
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
]);

function getTodayWeekday() {
    return WEEKDAY_NAMES[new Date().getDay()] || "";
}

function getSessionScheduleText(session = {}) {
    const preferredWeekday = typeof session.preferredWeekday === "string"
        ? session.preferredWeekday.trim()
        : "";

    if (!preferredWeekday) {
        return "Next session";
    }

    return preferredWeekday === getTodayWeekday()
        ? "Today's session"
        : `Next session: ${preferredWeekday}`;
}

function StartSessionCard({
    session,
    completedExerciseCount = 0,
    totalExerciseCount = 0,
    hasStartedSession = false,
    onPress,
}) {
    if (!session) {
        return null;
    }

    const totalExercises = totalExerciseCount || session.exercises?.length || 0;
    const completedExercises = Math.min(completedExerciseCount, totalExercises);
    const title = `Day ${session.day}`;
    const subtitle = `${totalExercises} exercises`;
    const scheduleText = getSessionScheduleText(session);
    const progressPercent =
        totalExercises > 0
            ? Math.round((completedExercises / totalExercises) * 100)
            : 0;
    const progressOffset =
        SESSION_PROGRESS_RING_CIRCUMFERENCE -
        SESSION_PROGRESS_RING_CIRCUMFERENCE * (progressPercent / 100);

    return (
        <ProfileNavigationCard
            title={title}
            description={subtitle}
            copyChildren={
                <>
                    <StandardText style={styles.sessionScheduleText}>
                        {scheduleText}
                    </StandardText>
                    <View style={styles.sessionProgressRing}>
                        <Svg
                            width={SESSION_PROGRESS_RING_SIZE}
                            height={SESSION_PROGRESS_RING_SIZE}
                            viewBox={`0 0 ${SESSION_PROGRESS_RING_SIZE} ${SESSION_PROGRESS_RING_SIZE}`}
                        >
                            <Circle
                                cx={SESSION_PROGRESS_RING_CENTER}
                                cy={SESSION_PROGRESS_RING_CENTER}
                                r={SESSION_PROGRESS_RING_RADIUS}
                                fill="none"
                                stroke="#5f5f5f"
                                strokeWidth={SESSION_PROGRESS_RING_STROKE}
                            />
                            <Circle
                                cx={SESSION_PROGRESS_RING_CENTER}
                                cy={SESSION_PROGRESS_RING_CENTER}
                                r={SESSION_PROGRESS_RING_RADIUS}
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth={SESSION_PROGRESS_RING_STROKE}
                                strokeLinecap="round"
                                strokeDasharray={`${SESSION_PROGRESS_RING_CIRCUMFERENCE} ${SESSION_PROGRESS_RING_CIRCUMFERENCE}`}
                                strokeDashoffset={progressOffset}
                                rotation="-90"
                                originX={SESSION_PROGRESS_RING_CENTER}
                                originY={SESSION_PROGRESS_RING_CENTER}
                            />
                        </Svg>
                        <View style={styles.sessionProgressTextWrap}>
                            <StandardText style={styles.sessionProgressText}>
                                {progressPercent}%
                            </StandardText>
                        </View>
                    </View>
                </>
            }
            actionElement={
                <View style={styles.startSessionButton}>
                    <StandardText style={styles.startSessionButtonText}>
                        {hasStartedSession ? "Continue" : "Start"}
                    </StandardText>
                </View>
            }
            onPress={onPress}
            wide
        />
    );
}

function AdjustPlanCard({ onPress }) {
    return (
        <ProfileNavigationCard
            title="Adjust plan"
            description="Sport, schedule, and logic"
            actionLabel="Adjust"
            onPress={onPress}
        />
    );
}

function MyPostsCard({ onPress }) {
    return (
        <ProfileNavigationCard
            title="My posts"
            description="Forum posts you created"
            actionLabel="View"
            onPress={onPress}
        />
    );
}

export default function StartView({
    hasProgram = false,
    plan,
    questionnaire,
    completedDays,
    currentSession,
    completedExerciseCount,
    totalExerciseCount,
    hasStartedSession,
    onStart,
    onStartSession,
    onAdjustPlan,
    onMyPosts,
}) {
    const insets = useSafeAreaInsets();

    return (
            <Dotted>
                <ScrollView
                    contentContainerStyle={{
                        paddingBottom: Math.max(insets.bottom + 96, 120),
                    }}
                    showsVerticalScrollIndicator={false}
                    style={styles.column}
                >
                    <View>
                        {hasProgram ? (
                            <View style={styles.programStatus}>
                                <ProgramProgressRing
                                    plan={plan}
                                    questionnaire={questionnaire}
                                    completedDays={completedDays}
                                />
                            </View>
                        ) : (
                            <StartProgramPrompt onStart={onStart} />
                        )}
                    </View>
                    {hasProgram ? (
                        <View style={styles.homeCards}>
                            <StartSessionCard
                                session={currentSession}
                                completedExerciseCount={completedExerciseCount}
                                totalExerciseCount={totalExerciseCount}
                                hasStartedSession={hasStartedSession}
                                onPress={onStartSession}
                            />
                            <View style={styles.homeActionRow}>
                                <AdjustPlanCard onPress={onAdjustPlan} />
                                <MyPostsCard onPress={onMyPosts} />
                            </View>
                        </View>
                    ) : null}
                    <TouchableOpacity style={styles.testButton} onPress={onStart}>
                        <StandardText textColor="#000" fontSize={18}>
                            Test questionnaire
                        </StandardText>
                    </TouchableOpacity>
                </ScrollView>
            </Dotted>
    );
}

// import QuestionnaireShell from "./QuestionnaireShell.jsx";

// export default function StartView({ onStart }) {
//     return (
//         <QuestionnaireShell>
//             <div className="start-view-center">
//                 <div className="start-view-card">
//                     <p className="start-view-eyebrow">Welcome</p>
//                     <h1 className="start-view-title">Combat Training Planner</h1>
//                     <p className="start-view-subtitle">
//                         Create a personalized training program for martial arts based on your goals and schedule.
//                     </p>

//                     <div className="start-view-actions">
//                         <button className="primary-button" onClick={onStart}>
//                             Create Training Program
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </QuestionnaireShell>
//     );
// }

const styles = StyleSheet.create({
    testButton: {
        alignSelf: "center",
        marginTop: 36,
        marginBottom: 20,
        paddingHorizontal: 22,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    programStatus: {
        minHeight: 400,
        justifyContent: "center",
        alignItems: "center",
    },
    column: {
        flex: 1,
    },
    homeCards: {
        gap: 12,
        marginHorizontal: 20,
        marginTop: -36,
        marginBottom: 24,
    },
    homeActionRow: {
        alignItems: "stretch",
        flexDirection: "row",
        gap: 12,
    },
    sessionProgressRing: {
        alignItems: "center",
        height: SESSION_PROGRESS_RING_SIZE,
        justifyContent: "center",
        marginTop: 6,
        width: SESSION_PROGRESS_RING_SIZE,
    },
    sessionScheduleText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "800",
        lineHeight: 16,
        marginTop: 8,
        textTransform: "uppercase",
    },
    sessionProgressTextWrap: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
    },
    sessionProgressText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "800",
        lineHeight: 15,
    },
    startSessionButton: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 999,
        flexShrink: 0,
        justifyContent: "center",
        minHeight: 36,
        minWidth: 88,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    startSessionButtonText: {
        color: "#141414",
        fontSize: 13,
        fontWeight: "800",
        lineHeight: 16,
    },

})
