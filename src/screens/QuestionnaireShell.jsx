import { View, StyleSheet } from "react-native";

export default function QuestionnaireShell({ children, onLogoClick }) {
    return (
        <View style={ styles.container} >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container : {
        flex: 1,
    }
});