import { View, Text, TouchableOpacity } from "react-native";
import QuestionnaireShell from "./QuestionnaireShell.jsx";
import StandardText from "../../components/textComponents/StandardText.jsx";

export default function StartView({ onStart }) {
    return (
        <QuestionnaireShell>
            <View>
                <StandardText>Welcome</StandardText>
                <StandardText>Combat Training Planner</StandardText>
                <StandardText>
                    Create a personalized training program for martial arts based on your goals and schedule.
                </StandardText>
                <TouchableOpacity onPress={onStart}>
                    <StandardText>Create Training Program</StandardText>
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
