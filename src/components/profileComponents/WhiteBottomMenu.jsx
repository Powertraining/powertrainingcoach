import {
  useEffect,
  useMemo,
  useRef } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";
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
  secondaryButtonText,
  secondaryButtonDisabled,
  onSecondaryButtonPress,
  secondaryButtonStyle,
  secondaryButtonTextStyle,
  bottomPadding = 18,
  avoidKeyboard = false,
}) {
  const insets = useSafeAreaInsets();
  const defaultSheetTranslateY = useRef(new Animated.Value(0)).current;
  const resolvedContent = content || children;

  useEffect(
    function resetHiddenSheetPositionACB() {
      if (!visible) {
        defaultSheetTranslateY.stopAnimation();
        defaultSheetTranslateY.setValue(0);
      }
    },
    [defaultSheetTranslateY, visible]
  );

  const defaultPanResponder = useMemo(
    function defaultPanResponderACB() {
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 4,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            defaultSheetTranslateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 70 || gestureState.vy > 0.75) {
            Animated.timing(defaultSheetTranslateY, {
              toValue: 420,
              duration: 160,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }).start(({ finished }) => {
              if (finished) {
                onDismiss?.();
              }
            });
            return;
          }

          Animated.spring(defaultSheetTranslateY, {
            toValue: 0,
            damping: 18,
            stiffness: 220,
            useNativeDriver: true,
          }).start();
        },
      });
    },
    [defaultSheetTranslateY, onDismiss]
  );
  const resolvedPanHandlers = panHandlers || defaultPanResponder.panHandlers;
  const resolvedAnimatedStyle =
    animatedStyle ||
    (!panHandlers
      ? {
          transform: [{ translateY: defaultSheetTranslateY }],
        }
      : null);
  const Sheet = resolvedAnimatedStyle ? Animated.View : View;

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
        <KeyboardAvoidingView
          behavior="height"
          enabled={avoidKeyboard}
          pointerEvents="box-none"
          style={styles.keyboardAvoidingHost}
        >
          <Sheet
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom + bottomPadding, 28) },
              sheetStyle,
              resolvedAnimatedStyle,
            ]}
          >
            <View style={styles.handleHitArea} {...resolvedPanHandlers}>
              <View style={styles.handle} />
            </View>

            <IBMPlexText style={styles.title}>{title}</IBMPlexText>
            {description ? (
              <IBMPlexText style={styles.description}>{description}</IBMPlexText>
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
                <IBMPlexText style={[styles.buttonText, buttonTextStyle]}>
                  {buttonText}
                </IBMPlexText>
              </Pressable>
            ) : null}

            {secondaryButtonText ? (
              <Pressable
                onPress={onSecondaryButtonPress}
                disabled={secondaryButtonDisabled}
                style={[
                  styles.secondaryButton,
                  secondaryButtonDisabled ? styles.buttonDisabled : null,
                  secondaryButtonStyle,
                ]}
              >
                <IBMPlexText style={[styles.secondaryButtonText, secondaryButtonTextStyle]}>
                  {secondaryButtonText}
                </IBMPlexText>
              </Pressable>
            ) : null}
          </Sheet>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardAvoidingHost: {
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
    marginBottom: 2,
    marginHorizontal: -20,
    marginTop: -12,
    minHeight: 54,
    paddingTop: 12,
  },
  title: {
    color: "#141414",
    fontSize: 20, fontWeight: "900",
    lineHeight: 25,
  },
  description: {
    color: "#5f5f5f",
    fontSize: 13, fontWeight: "600",
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
    fontSize: 13, fontWeight: "900",
    lineHeight: 17,
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#525252",
    fontSize: 13, fontWeight: "800",
    lineHeight: 17,
  },
});
