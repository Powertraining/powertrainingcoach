import { useEffect, useRef } from "react";
import { Animated, Easing, TouchableOpacity, Image } from "react-native";

const googleIcon = require("../../assets/icons/google.png");
const googleIconAspectRatio = 1;

export default function GoogleButtonComponent({ onPress, disabled, delay = 0 }) {
  const entranceProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    entranceProgress.setValue(0);
    Animated.timing(entranceProgress, {
      toValue: 1,
      duration: 210,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, entranceProgress]);

  const animatedStyle = {
    opacity: entranceProgress,
    transform: [
      {
        translateY: entranceProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={{
          borderWidth: 2,
          borderColor: "#585858",
          borderRadius: 120,
          marginHorizontal: 20,
          height: 70,
          paddingHorizontal: 14,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 15,
        }}
      >
        <Image
          source={googleIcon}
          resizeMode="contain"
          style={{ height: 23, aspectRatio: googleIconAspectRatio }}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}
