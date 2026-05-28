import { Pressable, StyleSheet, View } from "react-native";

import RowCard from "../homeComponents/RowCard.jsx";
import LockIcon from "../LockIcon.jsx";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";
const COLORS = {
  gold: "#C9B259",
};
export default function ProfileNavigationCard({
  title,
  description,
  actionLabel,
  actionElement,
  copyChildren,
  onPress,
  obscureContent = false,
  wide = false,
  children,
}) {
  const Card = wide ? View : RowCard;
  const isDisabled = obscureContent || !onPress;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={obscureContent ? undefined : onPress}
      style={({ pressed }) => [
        styles.navigationCardButton,
        pressed && !isDisabled ? styles.navigationCardButtonPressed : null,
      ]}
    >
      <Card
        style={[
          styles.navigationCard,
          wide ? styles.navigationCardWide : null,
        ]}
      >
        <View
          style={[
            styles.navigationCardContent,
            wide ? styles.navigationCardContentWide : null,
          ]}
        >
          <View
            style={[
              styles.navigationCardCopy,
              wide ? styles.navigationCardCopyWide : null,
            ]}
          >
            <IBMPlexText numberOfLines={2} adjustsFontSizeToFit style={styles.navigationCardTitle}>
              {title}
            </IBMPlexText>
            {description ? (
              <View style={obscureContent ? styles.obscuredContent : null}>
                <IBMPlexText numberOfLines={2} style={styles.navigationCardText}>
                  {description}
                </IBMPlexText>
              </View>
            ) : null}
            {obscureContent ? null : copyChildren || null}
          </View>

          {obscureContent ? null : children}

          {obscureContent && actionElement ? (
            <View style={styles.obscuredContent}>
              {actionElement}
            </View>
          ) : actionElement || null}

          {obscureContent && !actionElement && actionLabel ? (
            <IBMPlexText
              style={[
                styles.navigationActionText,
                styles.obscuredContent,
                wide ? styles.navigationActionTextWide : null,
              ]}
            >
              {actionLabel} &gt;
            </IBMPlexText>
          ) : !actionElement && actionLabel ? (
            <IBMPlexText
              style={[
                styles.navigationActionText,
                wide ? styles.navigationActionTextWide : null,
              ]}
            >
              {actionLabel} &gt;
            </IBMPlexText>
          ) : null}

          {obscureContent ? (
            <View pointerEvents="none" style={styles.lockIconOverlay}>
              <LockIcon />
            </View>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  navigationCardButton: {
    flex: 1,
  },
  navigationCardButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  navigationCard: {
    backgroundColor: "#141414",
  },
  navigationCardWide: {
    alignSelf: "stretch",
    borderColor: "#1E1E1E",
    borderRadius: 20,
    borderWidth: 2,
    minHeight: 84,
    overflow: "hidden",
    width: "100%",
  },
  navigationCardContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    position: "relative",
  },
  navigationCardContentWide: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    paddingVertical: 14,
  },
  navigationCardCopy: {
    gap: 4,
  },
  navigationCardCopyWide: {
    flex: 1,
    minWidth: 0,
  },
  navigationCardTitle: {
    color: "#ffffff",
    fontSize: 15, fontWeight: "800",
    lineHeight: 18,
  },
  navigationCardText: {
    color: "#9ca3af",
    fontSize: 12, fontWeight: "600",
    lineHeight: 16,
  },
  obscuredContent: {
    opacity: 0.42,
    filter: [{ blur: 4 }],
  },
  navigationActionText: {
    color: COLORS.gold,
    fontSize: 12, fontWeight: "800",
    lineHeight: 16,
    marginTop: 12,
    textTransform: "uppercase",
  },
  navigationActionTextWide: {
    flexShrink: 0,
    marginTop: 0,
  },
  lockIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(12, 12, 12, 0.42)",
    justifyContent: "center",
    zIndex: 5,
  },
});
