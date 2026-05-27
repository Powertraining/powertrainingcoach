import { useCallback, useEffect, useRef } from "react";
import { BackHandler, Platform } from "react-native";
import { useFocusEffect } from "expo-router";

export function useAndroidBackHandler(handler, dependencies = []) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android" || typeof handler !== "function") {
        return undefined;
      }

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          return handlerRef.current?.() !== false;
        }
      );

      return () => subscription.remove();
    }, dependencies)
  );
}
