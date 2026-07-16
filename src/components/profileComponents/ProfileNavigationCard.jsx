import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import RowCard from "../homeComponents/RowCard.jsx";
import LockIcon from "../LockIcon.jsx";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";

const COLORS = {
  background: "#111111",
  border: "#252525",
  blue: "#0A84FF",
  muted: "#9A9AA2",
};

export default function ProfileNavigationCard({
  title,
  description,
  actionLabel,
  actionElement,
  accentColor = COLORS.blue,
  copyChildren,
  iconElement,
  iconName,
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
          {iconElement ? (
            <View style={styles.navigationCardIcon}>{iconElement}</View>
          ) : iconName ? (
            <View style={styles.navigationCardIcon}>
              <Ionicons color={accentColor} name={iconName} size={26} />
            </View>
          ) : null}

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
                { color: accentColor },
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
                { color: accentColor },
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
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 184,
  },
  navigationCardWide: {
    alignSelf: "stretch",
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 84,
    overflow: "hidden",
    width: "100%",
  },
  navigationCardContent: {
    alignItems: "stretch",
    flex: 1,
    gap: 12,
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
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  navigationCardIcon: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  navigationCardCopyWide: {
    flex: 1,
    minWidth: 0,
  },
  navigationCardTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
  },
  navigationCardText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 15,
  },
  obscuredContent: {
    opacity: 0.42,
    filter: [{ blur: 4 }],
  },
  navigationActionText: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: "auto",
    paddingTop: 12,
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
