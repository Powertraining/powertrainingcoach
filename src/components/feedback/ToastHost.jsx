import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  View,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import IBMPlexText from "../textComponents/IBMPlexText.jsx";
import { colors, fonts, shadows } from "../../theme/colors.js";

const TOAST_DURATION_MS = 2000;

const ToastHost = observer(function ToastHost({ model }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-96)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const toast = model?.appToast;
  const [renderedToast, setRenderedToast] = useState(null);

  useEffect(() => {
    if (!toast?.message) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -96,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setRenderedToast(null);
      });
      return undefined;
    }

    setRenderedToast(toast);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 16,
        stiffness: 210,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();

    const timeoutId = setTimeout(() => {
      model.hideToast?.(toast.id);
    }, TOAST_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, [model, opacity, toast?.id, toast?.message, translateY]);

  if (!renderedToast?.message) {
    return null;
  }

  const isSuccess = renderedToast.type === "success";

  return (
    <View pointerEvents="none" style={[styles.host, { paddingTop: Math.max(insets.top + 10, 22) }]}>
      <Animated.View
        style={[
          styles.toast,
          isSuccess ? styles.successToast : styles.errorToast,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={[styles.statusDot, isSuccess ? styles.successDot : styles.errorDot]} />
        <IBMPlexText style={styles.message}>{renderedToast.message}</IBMPlexText>
      </Animated.View>
    </View>
  );
});

export default ToastHost;

const styles = StyleSheet.create({
  host: {
    alignItems: "center",
    left: 0,
    paddingHorizontal: 18,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  toast: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    maxWidth: 520,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11,
    width: "100%",
    ...shadows.large,
  },
  errorToast: {
    backgroundColor: "#fff7f7",
    borderColor: "rgba(220, 38, 38, 0.22)",
  },
  successToast: {
    backgroundColor: "#f1fff8",
    borderColor: "rgba(16, 185, 129, 0.24)",
  },
  statusDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  errorDot: {
    backgroundColor: colors.error,
  },
  successDot: {
    backgroundColor: colors.success,
  },
  message: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 19,
  },
});
