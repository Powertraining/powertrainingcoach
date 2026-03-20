import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView} from "react-native";
import QuestionnaireShell from "./QuestionnaireShell.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

export default function QuestionnaireSportView({ options, value, onChange, onContinue, onBack, onLogoClick }) {
    const canContinue = Boolean(value);

    return (
        <QuestionnaireShell onLogoClick={onLogoClick}>
            <View style={{backgroundColor: "#000",}}>
            
            <ScrollView>
            <TitleText>select your primary combat sport</TitleText>
                <View >
                    <View  style={styles.grid}>
                    {options.map((s) => (
                        <TouchableOpacity
                            key={s}
                            onPress={() => onChange(s)}
                            style={[styles.option, value === s && styles.optionSelected]}
                        >
                            <Image source={value === s ? require("../../assets/icons/fistSelected.png"):require("../../assets/icons/fist.png")} style={styles.imageStyle} />
                            <Text style={value === s ? styles.optionTextSelected : styles.optionText}>{s}</Text>

                        </TouchableOpacity>
                    ))}
                </View>
                </View>
            </ScrollView>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                            <Text>Back</Text>
                        </TouchableOpacity>
                

                <View>
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
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, backgroundColor: "#000",justifyContent: "center", 
        alignSelf:"center", width: 280},
    option: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: "#585858",
        borderStyle: "dashed",
        color: "#585858",
        width: 125,
        height: 125,
        backgroundColor: "#1E1E1E",
        alignItems: "center",
        justifyContent: "center"
    },
    imageStyle: {width:"60%", height: "60%", marginBottom: 10},
    optionSelected: {
        backgroundColor: "#fff",
        borderColor: "#000",
        
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
        color: "#000",
        backgroundColor: "#fff",
        width: 75,
        height: 75,
        borderRadius: 120,
        position: "absolute",
        bottom: 50,
        alignContent: "center",
    }
});
