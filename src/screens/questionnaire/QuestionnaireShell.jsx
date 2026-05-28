import { useEffect } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { reactiveModel } from "../../services/models/mobxReactiveModel.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
export default function QuestionnaireShell({
    children,
    hideTabBar = true,
    onLogoClick,
    onClose,
    topBackgroundColor,
}) {
    useEffect(() => {
        reactiveModel.setForumTabBarHidden(hideTabBar);

        return () => {
            reactiveModel.setForumTabBarHidden(false);
        };
    }, [hideTabBar]);

    return (
        <View style={ styles.container} >
            {topBackgroundColor ? (
                <View
                    pointerEvents="none"
                    style={[
                        styles.topBackground,
                        { backgroundColor: topBackgroundColor },
                    ]}
                />
            ) : null}
            {onClose ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    onPress={onClose}
                    style={styles.closeButton}
                >
                    <IBMPlexText style={styles.closeButtonText}>Go Back</IBMPlexText>
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
    topBackground: {
        height: 96,
        left: 0,
        position: "absolute",
        right: 0,
        top: 0,
        zIndex: 0,
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
        fontSize: 14, fontWeight: "700",
        lineHeight: 18,
    }
});
