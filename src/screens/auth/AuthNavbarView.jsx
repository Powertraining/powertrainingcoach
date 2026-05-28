import {
  useState,
  useEffect } from "react";
import { Animated, Easing, Keyboard, StyleSheet, TouchableOpacity, View } from "react-native";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const LABEL_SLIDE_DISTANCE = 16;
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function AuthNavbar({ onTabChange, onSubmitLogin, onSubmitSignup }) {
  const [active, setActive] = useState(1);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [submitLabel, setSubmitLabel] = useState("Login");
  const labelProgress = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    const nextLabel = active === 1 ? "Login" : "Sign Up";

    if (nextLabel === submitLabel) {
      return;
    }

    labelProgress.stopAnimation();
    Animated.timing(labelProgress, {
      toValue: 0,
      duration: 120,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setSubmitLabel(nextLabel);
      Animated.timing(labelProgress, {
        toValue: 1,
        duration: 190,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [active, labelProgress, submitLabel]);

  function switchToLoginACB() {
    setActive(1);
    onTabChange?.(1);
  }

  function switchToSignupACB() {
    setActive(2);
    onTabChange?.(2);
  }

  function pressSubmitACB() {
    if (active === 1) {
      onSubmitLogin?.();
    } else {
      onSubmitSignup?.();
    }
  }

  if (keyboardVisible) return null;

  const isLogin = active === 1;
  const labelAnimatedStyle = {
    opacity: labelProgress,
    transform: [
      {
        translateY: labelProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [LABEL_SLIDE_DISTANCE, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={styles.switchRow}>
        <IBMPlexText defaultWhite style={styles.switchText}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
        </IBMPlexText>
        <TouchableOpacity onPress={isLogin ? switchToSignupACB : switchToLoginACB}>
          <IBMPlexText defaultWhite style={[styles.switchText, styles.switchLink]}>
            {isLogin ? "Sign Up" : "Login"}
          </IBMPlexText>
        </TouchableOpacity>
      </View>

      <AnimatedTouchableOpacity onPress={pressSubmitACB} style={styles.submitButton}>
        <Animated.View style={labelAnimatedStyle}>
          <IBMPlexText style={styles.submitText}>
            {submitLabel}
          </IBMPlexText>
        </Animated.View>
      </AnimatedTouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginHorizontal: 20,
  },
  switchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  switchText: {
    fontSize: 18,
    lineHeight: 24,
  },
  switchLink: {
    textDecorationLine: "underline",
  },
  submitButton: {
    height: 70,
    borderRadius: 120,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  submitText: {
    color: "#000000",
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 22,
  },
});
