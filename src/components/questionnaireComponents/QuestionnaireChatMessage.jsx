import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

const MESSAGE_ANIMATION_DURATION = 280;

export default function QuestionnaireChatMessage({
  children,
  delay = 0,
  direction = "received",
  style,
}) {
  const entranceProgress = useRef(new Animated.Value(0)).current;
  const isSentMessage = direction === "sent";

  useEffect(() => {
    const animation = Animated.timing(entranceProgress, {
      toValue: 1,
      duration: MESSAGE_ANIMATION_DURATION,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [delay, entranceProgress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: entranceProgress,
          transform: [
            {
              translateX: entranceProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [isSentMessage ? 22 : -22, 0],
              }),
            },
            {
              translateY: entranceProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
            {
              scale: entranceProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.96, 1],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
