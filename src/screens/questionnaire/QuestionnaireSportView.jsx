import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView} from "react-native";
import QuestionnaireShell from "./QuestionnaireShell.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

export default function QuestionnaireSportView({ options, value, onChange, onContinue, onBack, onLogoClick }) {
    const canContinue = Boolean(value);

    return (
        <QuestionnaireShell onLogoClick={onLogoClick}>
            <View>
    
            <ScrollView>
            <TitleText>select your primary combat sport</TitleText>
                <View >
                    <View  style={styles.grid}>
                    {options.map((option) => {
                        const isSelected = value === option.value;

                        return (
                        <TouchableOpacity
                            key={option.id}
                            onPress={() => onChange(isSelected ? null : option.value)}
                            style={[styles.option, isSelected && styles.optionSelected]}
                        >
                            <Image source={option.image} style={isSelected ? styles.selectedImageStyle: styles.nonSelctedImageStyle} resizeMode="contain" />
                            <Text style={isSelected ? styles.optionTextSelected : styles.optionText}>{option.label}</Text>

                        </TouchableOpacity>
                    )})}
                </View>
                </View>
            </ScrollView>
            </View>
            <TouchableOpacity
                onPress={canContinue ? onContinue : onBack}
                style={canContinue ? styles.continueButton : styles.bottomBackButton}
            >
                <Text style={[styles.buttonText, !canContinue && styles.bottomBackButtonText]}>
                    {canContinue ? "Continue" : "Back"}
                </Text>
            </TouchableOpacity>
        </QuestionnaireShell>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 15, justifyContent: "center",
        alignSelf:"center", width: 280},
    option: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 30,
        borderWidth: 1.2,
        borderColor: "#585858",
        borderStyle: "dashed",
        color: "#585858",
        width: 125,
        height: 125,
        backgroundColor: "#1E1E1E",
        alignItems: "center",
        justifyContent: "center"
    },
    nonSelctedImageStyle: {
        width:"60%", height: "60%", marginBottom: 10, tintColor: "#8E8E8E"},
    selectedImageStyle:{
        width:"60%", height: "60%", marginBottom: 10, tintColor: "#000"
    },
    optionSelected: {
        backgroundColor: "#fff",
        borderStyle: "solid",
        
    },
    optionText: {
        color: "#8E8E8E",
        fontFamily: "BebasNeue",
        fontSize:20,
    },
    optionTextSelected: {
        color: "#000",
        fontFamily: "BebasNeue",
        fontSize:20
    },
    buttonText: {
        fontFamily: "BebasNeue",
        fontSize: 22
    },
    continueButton : {
        color: "#000",
        backgroundColor: "#fff",
        width: "50%",
        margin:"auto",
        height: 60,
        borderRadius: 120,
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        bottom: 0,
        marginBottom: 20,
        alignSelf: "center"
    },
    bottomBackButton: {
        position: "absolute",
        bottom: 0,
        marginBottom: 20,
        alignSelf: "center",
        height: 60,
        justifyContent: "center",
    },
    bottomBackButtonText: {
        color: "#585858"
    }
});
