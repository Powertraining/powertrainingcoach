import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import QuestionnaireShell from "./QuestionnaireShell.jsx";

export default function QuestionnaireSportView({ options, value, onChange, onContinue, onBack, onLogoClick }) {
    const canContinue = Boolean(value);

    return (
        <QuestionnaireShell onLogoClick={onLogoClick}>
            <View>
                <Text>What is your primary combat sport?</Text>

                <View style={styles.grid}>
                    {options.map((s) => (
                        <TouchableOpacity
                            key={s}
                            onPress={() => onChange(s)}
                            style={[styles.option, value === s && styles.optionSelected]}
                        >
                            <Text style={value === s && styles.optionTextSelected}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    {onBack && (
                        <TouchableOpacity onPress={onBack}>
                            <Text>Back</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={onContinue} disabled={!canContinue}>
                        <Text>Continue</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </QuestionnaireShell>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    option: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.2)",
    },
    optionSelected: {
        backgroundColor: "#111",
        borderColor: "#111",
    },
    optionTextSelected: {
        color: "white",
    },
});

// import QuestionnaireShell from "./QuestionnaireShell.jsx";

// export default function QuestionnaireSportView({
//     options,
//     value,
//     onChange,
//     onContinue,
//     onBack,
//     onLogoClick,
// }) {
//     const canContinue = Boolean(value);

//     return (
//         <QuestionnaireShell onLogoClick={onLogoClick}>
//             <div className="questionnaire-center">
//                 <div className="questionnaire-content">
//                     <h2 className="questionnaire-title">What is your primary combat sport?</h2>

//                     <div className="sport-options-grid">
//                         {options.map((s) => (
//                             <label key={s} className="sport-option-label">
//                                 <input
//                                     type="radio"
//                                     name="primarySport"
//                                     value={s}
//                                     checked={value === s}
//                                     onChange={() => onChange(s)}
//                                     className="sport-option-radio"
//                                 />
//                                 <span>{s}</span>
//                             </label>
//                         ))}
//                     </div>

//                     <div className="questionnaire-footer-between">
//                         {onBack && (
//                             <button onClick={onBack} className="secondary-button">
//                                 Back
//                             </button>
//                         )}

//                         <button
//                             onClick={onContinue}
//                             disabled={!canContinue}
//                             className="primary-button"
//                         >
//                             Continue
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </QuestionnaireShell>
//     );
// }
