import { StyleSheet, Text, View } from "react-native";

export default function MembershipBenefitItem({ title, description }) {
  return (
    <View style={styles.item}>
      <Text numberOfLines={2} adjustsFontSizeToFit style={styles.title}>
        {title}
      </Text>
      <View style={styles.underline} />
      <Text numberOfLines={4} style={styles.description}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  title: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 15,
    minHeight: 30,
    textAlign: "center",
  },
  underline: {
    alignSelf: "stretch",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.66)",
  },
  description: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 13,
    textAlign: "center",
  },
});
