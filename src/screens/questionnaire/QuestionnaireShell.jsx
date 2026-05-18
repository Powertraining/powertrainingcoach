import { useEffect } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { reactiveModel } from "../../services/models/mobxReactiveModel.js";

export default function QuestionnaireShell({
    children,
    hideTabBar = true,
    onLogoClick,
    onClose,
}) {
    useEffect(() => {
        reactiveModel.setForumTabBarHidden(hideTabBar);

        return () => {
            reactiveModel.setForumTabBarHidden(false);
        };
    }, [hideTabBar]);

    return (
        <View style={ styles.container} >
            {onClose ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    onPress={onClose}
                    style={styles.closeButton}
                >
                    <Text style={styles.closeButtonText}>Go Back</Text>
                </Pressable>
            ) : null}
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container : {
        flex: 1,
        position: "relative",
    },
    closeButton: {
        position: "absolute",
        top: 0,
        left: 0,
        paddingHorizontal: 24,
        paddingTop: 18,
        paddingBottom: 8,
        zIndex: 20,
    },
    closeButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "700",
        lineHeight: 18,
    }
});
