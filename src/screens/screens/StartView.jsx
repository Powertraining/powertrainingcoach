import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import QuestionnaireShell from "./QuestionnaireShell.jsx";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx"
import GoldGradient from "../../components/colorComponents/GoldGradient.jsx"

export default function StartView({ onStart }) {
    return (
        <QuestionnaireShell>
            <View>
                <TitleText>Lets start by creating your program</TitleText>
                <TouchableOpacity onPress={onStart} style={styles.bigButton}>
                    <GoldGradient style={{borderRadius: styles.bigButton.borderRadius}}/>
                    <StandardText textColor="#fff" fontSize={36}>Start</StandardText>
                </TouchableOpacity>
            </View>
        </QuestionnaireShell>
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
    bigButton: {backgroundColor: "#fff",
        height: 90,
        marginHorizontal: 70,
        borderRadius: 120,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
    },
})