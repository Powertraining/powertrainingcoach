import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WhiteBottomMenu({
  visible,
  onDismiss,
  title,
  description,
  content,
  children,
  buttonText,
  buttonDisabled,
  onButtonPress,
  panHandlers,
  sheetStyle,
  animatedStyle,
  contentStyle,
  buttonStyle,
  buttonTextStyle,
  bottomPadding = 18,
}) {
  const insets = useSafeAreaInsets();
  const Sheet = animatedStyle ? Animated.View : View;
  const resolvedContent = content || children;

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      hardwareAccelerated
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={onDismiss}
    >
      <View style={styles.root}>
        <Pressable onPress={onDismiss} style={styles.dismissLayer} />
        <Sheet
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom + bottomPadding, 28) },
            sheetStyle,
            animatedStyle,
          ]}
        >
          <View style={styles.handleHitArea} {...(panHandlers || {})}>
            <View style={styles.handle} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}

          {resolvedContent ? (
            <View style={[styles.content, contentStyle]}>{resolvedContent}</View>
          ) : null}

          {buttonText ? (
            <Pressable
              onPress={onButtonPress}
              disabled={buttonDisabled}
              style={[
                styles.button,
                buttonDisabled ? styles.buttonDisabled : null,
                buttonStyle,
              ]}
            >
              <Text style={[styles.buttonText, buttonTextStyle]}>
                {buttonText}
              </Text>
            </Pressable>
          ) : null}
        </Sheet>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  dismissLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 19,
  },

sheet: {
  backgroundColor: "#ffffff",
  borderColor: "#e5e5e5",
  borderWidth: 2,
  borderBottomColor: "#ffffff",
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  bottom: 0,
  gap: 14,
  left: 0,
  overflow: "hidden",
  paddingHorizontal: 20,
  paddingTop: 12,
  position: "absolute",
  right: 0,
  zIndex: 21,
},  
  handle: {
    alignSelf: "center",
    backgroundColor: "#d4d4d4",
    borderRadius: 999,
    height: 5,
    marginBottom: 10,
    width: 48,
  },
  handleHitArea: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    minHeight: 28,
  },
  title: {
    color: "#141414",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
  },
  description: {
    color: "#5f5f5f",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  content: {
    alignSelf: "stretch",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderRadius: 999,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.58,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 17,
  },
});
