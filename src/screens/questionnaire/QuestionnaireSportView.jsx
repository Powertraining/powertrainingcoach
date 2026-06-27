import { View, StyleSheet, ScrollView } from "react-native";
import QuestionnaireShell from "./QuestionnaireShell.jsx";
import QuestionnaireSportOptionButton from "../../components/questionnaireComponents/QuestionnaireSportOptionButton.jsx";
import QuestionnaireBottomActionButton from "../../components/questionnaireComponents/QuestionnaireBottomActionButton.jsx";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const SPORT_OPTION_WIDTH = 127.4;
const SPORT_OPTION_GAP = 15;
const SPORT_GRID_WIDTH = SPORT_OPTION_WIDTH * 2 + SPORT_OPTION_GAP;

export default function QuestionnaireSportView({ options, value, onChange, onContinue, onBack, onLogoClick, onClose }) {
    const canContinue = Boolean(value);

    return (
        <QuestionnaireShell onLogoClick={onLogoClick} onClose={onClose}>
            <View style={styles.content}>
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
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: SPORT_OPTION_GAP, justifyContent: "flex-start",
        alignSelf:"center", width: SPORT_GRID_WIDTH},
});
