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
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                            <Text style={[styles.buttonText,{color:"#585858"}]}>Back</Text>
                        </TouchableOpacity>
            {value !== null ? 
                    <TouchableOpacity onPress={onContinue} disabled={!canContinue} style={styles.continueButton}>
                        <Text style={styles.buttonText}>Continue</Text>
                    </TouchableOpacity> 
                    
                    : null}
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
        borderWidth: 1.8,
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
        width:"60%", height: "60%", marginBottom: 10, tintColor: "#fff"},
    selectedImageStyle:{
        width:"60%", height: "60%", marginBottom: 10, tintColor: "#000"
    },
    optionSelected: {
        backgroundColor: "#fff",
        borderColor: "#000",
        borderStyle: "solid",
        
    },
    optionText: {
        color: "white",
        fontFamily: "BebasNeue",
        fontSize:20,
    },
    optionTextSelected: {
        color: "#000",
        fontFamily: "BebasNeue",
        fontSize:20
    },
    backButton: {
        alignSelf: "flex-start",
        margin: 10,
        position: "absolute",
        width: 40,
        height: 30,
        zIndex: 10,
    },
    buttonText: {
        fontFamily: "BebasNeue",
        fontSize: 22
    },
    continueButton : {
        color: "#000",
        backgroundColor: "#fff",
        width: "90%",
        margin:"auto",
        height: 75,
        borderRadius: 120,
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        bottom: 0,
        marginBottom: 20,
        alignSelf: "center"
    },
});
