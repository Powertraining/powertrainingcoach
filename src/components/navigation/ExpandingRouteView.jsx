import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

export default function ExpandingRouteView({ children, routeKey }) {
  const entranceProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    entranceProgress.setValue(0);

    Animated.timing(entranceProgress, {
      toValue: 1,
      duration: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entranceProgress, routeKey]);

  const scale = entranceProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1],
  });
  const translateY = entranceProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });
  const opacity = entranceProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
