import {
  useState,
  useEffect } from "react";
import { Animated, Easing, TouchableOpacity, View, Keyboard } from "react-native";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function AuthNavbar({ onTabChange, onSubmitLogin, onSubmitSignup }) {
  const [active, setActive] = useState(1);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const tabProgress = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    Animated.timing(tabProgress, {
      toValue: active === 1 ? 0 : 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [active, tabProgress]);

  function pressLoginACB() {
    if (active === 1) {
      onSubmitLogin?.();
    } else {
      setActive(1);
      onTabChange(1);
    }
  }

  function pressSignupACB() {
    if (active === 2) {
      onSubmitSignup?.();
    } else {
      setActive(2);
      onTabChange(2);
    }
  }

  if (keyboardVisible) return null;

  const loginAnimatedStyle = {
    flex: tabProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [3, 1],
    }),
    backgroundColor: tabProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ["#ffffff", "rgba(255,255,255,0)"],
    }),
  };

  const signupAnimatedStyle = {
    flex: tabProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 3],
    }),
    backgroundColor: tabProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ["rgba(255,255,255,0)", "#ffffff"],
    }),
  };

  return (
    <View style={{ alignSelf: "stretch", flexDirection: "row",
      backgroundColor: "#151515", alignItems: "center", marginHorizontal: 20, borderRadius: 120, height: 70,
    }}>
      <AnimatedTouchableOpacity onPress={pressLoginACB}
        style={[{ height: "100%", justifyContent: "center", alignItems: "center", borderRadius: 120 }, loginAnimatedStyle]}>
        <IBMPlexText defaultWhite style={[active === 1 ? { color: "#000" } : null, { fontSize: 18 }]}>
          Login
        </IBMPlexText>
      </AnimatedTouchableOpacity>

      <AnimatedTouchableOpacity onPress={pressSignupACB}
        style={[{ height: "100%", justifyContent: "center", alignItems: "center", borderRadius: 120 }, signupAnimatedStyle]}>
        <IBMPlexText defaultWhite style={[active === 2 ? { color: "#000" } : null, { fontSize: 18 }]}>
          Sign Up
        </IBMPlexText>
      </AnimatedTouchableOpacity>
    </View>
  );
}
