import { View, StyleSheet, ScrollView } from "react-native";
import QuestionnaireShell from "./QuestionnaireShell.jsx";
import QuestionnaireSportOptionButton from "../../components/questionnaireComponents/QuestionnaireSportOptionButton.jsx";
import QuestionnaireBottomActionButton from "../../components/questionnaireComponents/QuestionnaireBottomActionButton.jsx";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

export default function QuestionnaireSportView({ options, value, onChange, onContinue, onBack, onLogoClick, onClose }) {
    const canContinue = Boolean(value);

    return (
        <QuestionnaireShell onLogoClick={onLogoClick} onClose={onClose}>
            <View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
            <IBMPlexText titleBlock >select your primary combat sport</IBMPlexText>
                <View >
                    <View  style={styles.grid}>
                    {options.map((option) => {
                        const isSelected = value === option.value;

                        return (
                        <QuestionnaireSportOptionButton
                            key={option.id}
                            option={option}
                            isSelected={isSelected}
                            onPress={() => onChange(isSelected ? null : option.value)}
                        />
                    )})}
                </View>
                </View>
            </ScrollView>
            </View>
            <QuestionnaireBottomActionButton
                canContinue={canContinue}
                onContinue={onContinue}
                onBack={onBack}
                hideWhenDisabled
            />
        </QuestionnaireShell>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 72,
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 15, justifyContent: "flex-start",
        alignSelf:"center", width: 280},
});
