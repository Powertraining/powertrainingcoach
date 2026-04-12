import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { reactiveModel } from "../../services/models/mobxReactiveModel.js";

export default function QuestionnaireShell({ children, onLogoClick }) {
    useEffect(() => {
        reactiveModel.setForumTabBarHidden(true);

        return () => {
            reactiveModel.setForumTabBarHidden(false);
        };
    }, []);

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
