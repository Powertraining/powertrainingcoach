import { Pressable, StyleSheet, Text, View } from "react-native";

import GoldGradient from "../colorComponents/GoldGradient.jsx";

const GOLD = "#C9B259";

export default function MembershipPlanOption({
  title,
  price,
  badge,
  selected = false,
  disabled = false,
  onPress,
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected ? styles.rowSelected : null,
        disabled ? styles.rowDisabled : null,
        pressed ? styles.rowPressed : null,
      ]}
    >
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.title}>
            {title}
          </Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{price}</Text>
          {badge ? (
            <View style={styles.badge}>
              <GoldGradient />
              <Text numberOfLines={1} style={styles.badgeText}>
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={[styles.radio, selected ? styles.radioSelected : null]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 4,
    flexDirection: "row",
    gap: 14,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowSelected: {},
  rowDisabled: {
    opacity: 0.55,
  },
  rowPressed: {
    transform: [{ scale: 0.99 }],
  },
  copy: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
  },
  price: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  priceRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: "relative",
  },
  badgeText: {
    color: "#111111",
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 12,
  },
  radio: {
    alignItems: "center",
    borderColor: "#585858",
    borderRadius: 999,
    borderStyle: "dashed",
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  radioSelected: {
    borderColor: "#ffffff",
    borderStyle: "solid",
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  radioDot: {
    backgroundColor: GOLD,
    borderRadius: 999,
    height: 10,
    width: 10,
  },
});
