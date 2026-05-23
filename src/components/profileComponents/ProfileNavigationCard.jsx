import { Pressable, StyleSheet, Text, View } from "react-native";

import RowCard from "../homeComponents/RowCard.jsx";

export default function ProfileNavigationCard({
  title,
  description,
  actionLabel,
  actionElement,
  copyChildren,
  onPress,
  wide = false,
  children,
}) {
  const Card = wide ? View : RowCard;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navigationCardButton,
        pressed ? styles.navigationCardButtonPressed : null,
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
            <Text numberOfLines={2} adjustsFontSizeToFit style={styles.navigationCardTitle}>
              {title}
            </Text>
            {description ? (
              <Text numberOfLines={2} style={styles.navigationCardText}>
                {description}
              </Text>
            ) : null}
            {copyChildren || null}
          </View>

          {children}

          {actionElement || null}

          {!actionElement && actionLabel ? (
            <Text
              style={[
                styles.navigationActionText,
                wide ? styles.navigationActionTextWide : null,
              ]}
            >
              {actionLabel} &gt;
            </Text>
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
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 18,
  },
  navigationCardText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  navigationActionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    marginTop: 12,
    textTransform: "uppercase",
  },
  navigationActionTextWide: {
    flexShrink: 0,
    marginTop: 0,
  },
});
