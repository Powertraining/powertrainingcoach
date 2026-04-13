import { View, StyleSheet, ScrollView } from "react-native";
import QuestionnaireShell from "./QuestionnaireShell.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";
import QuestionnaireDecorativeRing from "../../components/questionnaireComponents/QuestionnaireDecorativeRing.jsx";
import QuestionnaireSportOptionButton from "../../components/questionnaireComponents/QuestionnaireSportOptionButton.jsx";
import QuestionnaireBottomActionButton from "../../components/questionnaireComponents/QuestionnaireBottomActionButton.jsx";

export default function QuestionnaireSportView({ options, value, onChange, onContinue, onBack, onLogoClick }) {
    const canContinue = Boolean(value);

    return (
        <QuestionnaireShell onLogoClick={onLogoClick}>
            <View>
            <QuestionnaireDecorativeRing style={{ left: -105, top: -105, width: 180, borderRadius: 75, borderColor: "#C9B259" }} />
            <QuestionnaireDecorativeRing />
    
            <ScrollView>
            <TitleText >select your primary combat sport</TitleText>
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
            <QuestionnaireBottomActionButton canContinue={canContinue} onContinue={onContinue} onBack={onBack} />
        </QuestionnaireShell>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 15, justifyContent: "center",
        alignSelf:"center", width: 280},
});
