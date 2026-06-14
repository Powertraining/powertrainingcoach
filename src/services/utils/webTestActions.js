import { useEffect } from "react";
import { Platform } from "react-native";

export function isPagesPhonePreview() {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    Boolean(window.__PAGES_PHONE_PREVIEW__)
  );
}

export function useWebTestActions(sourceId, title, actions = [], enabled = true) {
  useEffect(() => {
    if (!isPagesPhonePreview()) {
      return undefined;
    }

    const normalizedActions = enabled
      ? actions.filter(
          (action) => action?.label && typeof action.onPress === "function"
        )
      : [];

    window.dispatchEvent(
      new CustomEvent("pages-preview-test-actions", {
        detail: {
          sourceId,
          title,
          actions: normalizedActions,
        },
      })
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("pages-preview-test-actions", {
          detail: {
            sourceId,
            title,
            actions: [],
          },
        })
      );
    };
  }, [sourceId, title, actions, enabled]);
}
