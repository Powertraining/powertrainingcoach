import { useEffect, useRef } from "react";
import { Animated, Easing, View, TextInput } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

function AuthInputIcon({ name }) {
  const iconProps = {
    width: 30,
    height: 30,
    viewBox: "0 0 24 24",
    fill: "none",
  };
  const strokeProps = {
    stroke: "#ffffff",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "email") {
    return (
      <Svg {...iconProps}>
        <Path {...strokeProps} d="M4 6h16v12H4z" />
        <Path {...strokeProps} d="m4 7 8 6 8-6" />
      </Svg>
    );
  }

  if (name === "lock") {
    return (
      <Svg {...iconProps}>
        <Path {...strokeProps} d="M7 11h10v9H7z" />
        <Path {...strokeProps} d="M9 11V8a3 3 0 0 1 6 0v3" />
      </Svg>
    );
  }

  return (
    <Svg {...iconProps}>
      <Circle {...strokeProps} cx="12" cy="8" r="4" />
      <Path {...strokeProps} d="M5 21a7 7 0 0 1 14 0" />
    </Svg>
  );
}

export default function SignFormInput({ text, image, inputProps, type, delay = 0 }) {
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
    <Animated.View
      style={[{
        borderWidth: 2,
        borderColor: "#585858",
        borderRadius: 120,
        marginHorizontal: 20,
        backgroundColor: "#151515",
        height: 70,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
      }, animatedStyle]}
    >
      {image ? (
        <View style={{ width: 30, height: 30, marginLeft: 10, marginRight: 10 }}>
          <AuthInputIcon name={image} />
        </View>
      ) : null}
      <TextInput
        placeholder={text}
        placeholderTextColor="#fff"
        style={{
          color: "#fff", fontSize: 18,
          flex: 1,
          textAlignVertical: "center",
          height: "100%",
          paddingVertical: 0,
        }}
        {...inputProps}
      />
    </Animated.View>
  );
}

