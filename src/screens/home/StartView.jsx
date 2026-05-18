import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import StandardText from "../../components/textComponents/StandardText.jsx";
import Dotted from "../../components/colorComponents/Dotted.jsx";
import ProgramProgressRing from "../../components/homeComponents/ProgramProgressRing.jsx";
import RowCard from "../../components/homeComponents/RowCard.jsx";
import StartProgramPrompt from "../../components/homeComponents/StartProgramPrompt.jsx";

export default function StartView({
    hasProgram = false,
    plan,
    questionnaire,
    completedDays,
    onStart,
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
                    <StandardText style={styles.screenTitle} center>
                        Powertraining
                    </StandardText>
                    <TouchableOpacity style={styles.testButton} onPress={onStart}>
                        <StandardText textColor="#000" fontSize={18}>
                            Test questionnaire
                        </StandardText>
                    </TouchableOpacity>
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
                    
                    <View style={styles.row}>
                        <RowCard/>
                        <RowCard/>
                    </View>
                    <View style={styles.row}>
                        <RowCard/>
                        <RowCard/>
                    </View>
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
    screenTitle: {
        marginTop: 64,
        fontSize: 14,
        textAlign: "center",
        color: "#fff",
    },
    testButton: {
        alignSelf: "center",
        marginTop: 18,
        paddingHorizontal: 22,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    programStatus: {
        minHeight: 495,
        justifyContent: "center",
        alignItems: "center",
    },
    column: {
        flex: 1,
    },
    row: {
        flexDirection: "row",
        gap: 15,
        marginHorizontal: 20,
        marginBottom: 15,
    }

})
