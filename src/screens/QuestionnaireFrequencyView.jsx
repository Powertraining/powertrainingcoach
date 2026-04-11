import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import QuestionnaireShell from "./QuestionnaireShell.jsx";
import TitleText from "../components/textComponents/TitleText.jsx"
import StandardText from "../components/textComponents/StandardText.jsx"

export default function QuestionnaireFrequencyView({ value, onChange, onBack, onContinue, onLogoClick }) {
    return (
        <QuestionnaireShell onLogoClick={onLogoClick}>
            <View style={styles.container}>
                <TitleText>How many strength sessions per week do you want?</TitleText>

                <View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <StandardText>total body, comprehensive</StandardText>
                        <StandardText>more divided, scattered</StandardText>
                    </View>

                    <Slider
                        minimumValue={1}
                        maximumValue={5}
                        step={1}
                        value={value}
                        onValueChange={(v) => onChange(v)}
                        minimumTrackTintColor="#fff"
                        thumbTintColor="#fff"  
                        style = {styles.slider}
                    />

                    <StandardText>Selected: {value} sessions per week</StandardText>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <TouchableOpacity onPress={onBack}>
                        <StandardText>Back</StandardText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onContinue}>
                        <StandardText>Continue</StandardText>
                    </TouchableOpacity>
                </View>
            </View>
        </QuestionnaireShell>
    );
}

const styles = StyleSheet.create({
    slider : {
        
    }
});
