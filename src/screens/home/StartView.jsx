import { View, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import QuestionnaireShell from "../QuestionnaireShell.jsx";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";
import GoldGradient from "../../components/colorComponents/GoldGradient.jsx";
import Dotted from "../../components/colorComponents/Dotted.jsx";
import RowCard from "../../components/homeComponents/RowCard.jsx";

export default function StartView({ onStart }) {
    return (
            <Dotted>
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <View>
                        <TitleText>Lets start by creating your program</TitleText>
                        <TouchableOpacity onPress={onStart} style={styles.bigButton}>
                            <GoldGradient style={{borderRadius: styles.bigButton.borderRadius}}/>
                            <StandardText textColor="#fff" fontSize={36}>Start</StandardText>
                        </TouchableOpacity>
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
    content: {
        paddingBottom: 24,
    },
    bigButton: {backgroundColor: "#fff",
        height: "75",
        marginHorizontal: 70,
        borderRadius: 120,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        marginBottom: 120,
    },
    row: {
        flexDirection: "row",
        gap: 15,
        marginHorizontal: 20,
        marginBottom: 15,
    }

})
