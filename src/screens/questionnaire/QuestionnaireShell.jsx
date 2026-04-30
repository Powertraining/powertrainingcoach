import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { reactiveModel } from "../../services/models/mobxReactiveModel.js";

export default function QuestionnaireShell({
    children,
    hideTabBar = true,
    onLogoClick,
}) {
    useEffect(() => {
        reactiveModel.setForumTabBarHidden(hideTabBar);

        return () => {
            reactiveModel.setForumTabBarHidden(false);
        };
    }, [hideTabBar]);

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
