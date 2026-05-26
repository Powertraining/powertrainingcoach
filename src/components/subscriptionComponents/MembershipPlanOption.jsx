import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import GoldGradient from "../colorComponents/GoldGradient.jsx";

const GOLD = "#C9B259";

export default function MembershipPlanOption({
  title,
  price,
  badge,
  selected = false,
  current = false,
  disabled = false,
  loading = false,
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
        current ? styles.rowCurrent : null,
        selected ? styles.rowSelected : null,
        loading ? styles.rowLoading : null,
        disabled ? styles.rowDisabled : null,
        pressed ? styles.rowPressed : null,
      ]}
    >
      <View style={styles.copy}>
        {current ? <Text style={styles.currentLabel}>YOUR PLAN</Text> : null}
        {loading ? <Text style={styles.loadingLabel}>LOADING</Text> : null}
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

      <View
        style={[
          styles.radio,
          selected ? styles.radioSelected : null,
          loading ? styles.radioLoading : null,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : selected ? (
          <View style={styles.radioDot} />
        ) : null}
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
  rowLoading: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  rowCurrent: {
    backgroundColor: "rgba(255,255,255,0.14)",
    minHeight: 84,
  },
  rowDisabled: {
    opacity: 0.72,
  },
  rowPressed: {
    transform: [{ scale: 0.99 }],
  },
  copy: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  currentLabel: {
    color: GOLD,
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 14,
  },
  loadingLabel: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 14,
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
  radioLoading: {
    borderColor: "rgba(255,255,255,0.45)",
    borderStyle: "solid",
  },
  radioDot: {
    backgroundColor: GOLD,
    borderRadius: 999,
    height: 10,
    width: 10,
  },
});
