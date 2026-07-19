import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import BlackGradient from "../colorComponents/BlackGradient.jsx";
import GoldGradient, {
  GOLD_GRADIENT_COLORS,
  GOLD_GRADIENT_END,
  GOLD_GRADIENT_LOCATIONS,
  GOLD_GRADIENT_START,
} from "../colorComponents/GoldGradient.jsx";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";

const GOLD = "#D2AD24";
const BENEFIT_ICON_COLOR = "#F3D04F";
// Exact path geometry from src/assets/svg/Logo.svg.
const APP_LOGO_PATHS = [
  "M226.135 150.142C233.946 142.332 246.609 142.332 254.419 150.142L274.997 170.719C282.807 178.53 282.807 191.193 274.997 199.004L93.2808 380.72C68.7485 405.252 28.9737 405.252 4.44148 380.72C1.98825 378.267 1.98825 374.289 4.44148 371.836L226.135 150.142Z",
  "M285.073 207.142C292.883 199.332 305.546 199.332 313.357 207.142L331.398 225.183C337.276 231.061 337.276 240.592 331.398 246.47L263.897 313.972C242.394 335.474 207.532 335.474 186.03 313.972C183.88 311.821 183.88 308.335 186.03 306.185L285.073 207.142Z",
  "M452.088 122.934C454.138 120.884 457.463 120.884 459.514 122.934C480.019 143.44 480.019 176.686 459.514 197.192L446.012 210.694C443.215 213.49 438.682 213.49 435.886 210.694L414.249 189.057C406.438 181.247 406.438 168.584 414.249 160.773L452.088 122.934Z",
  "M206.628 87.1104C204.275 84.7572 204.275 80.942 206.628 78.5888C230.16 55.0572 268.312 55.0571 291.844 78.5888L430.344 217.09C432.698 219.443 432.698 223.258 430.344 225.611C406.813 249.143 368.66 249.143 345.129 225.611L206.628 87.1104Z",
  "M181.497 181.179C179.486 183.19 176.225 183.19 174.214 181.179C154.105 161.07 154.105 128.467 174.214 108.358L188.33 94.2421C191.121 91.4516 195.645 91.4516 198.435 94.2421L220 115.806C227.42 123.226 227.42 135.256 220 142.676L181.497 181.179Z",
];
const BENEFITS = [
  {
    title: "Analysis",
    description: "2 analyses per month",
    icon: "videocam",
  },
  {
    title: "Programs",
    description: "Personalized optimized plans",
    icon: "calendar",
  },
  {
    title: "Community",
    description: "Exclusive pro-led forum",
    icon: "people",
  },
];

function getPlanTier(planName) {
  const normalizedName = String(planName || "").toLowerCase();

  if (normalizedName.includes("expert")) return "expert";
  if (normalizedName.includes("pro")) return "pro";
  if (normalizedName.includes("starter")) return "starter";
  return "none";
}

function AppLogoIcon({ tier }) {
  const gradientId = `app-logo-${tier}`;
  const fill = tier === "none" ? "#FFFFFF" : `url(#${gradientId})`;

  return (
    <Svg width={48} height={42} viewBox="0 0 497 426" fill="none">
      <Defs>
        {tier === "starter" ? (
          <SvgLinearGradient id={gradientId} x1="40" y1="25" x2="450" y2="400">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="0.48" stopColor="#8D8D8D" />
            <Stop offset="1" stopColor="#111111" />
          </SvgLinearGradient>
        ) : null}
        {tier === "pro" ? (
          <SvgLinearGradient
            id={gradientId}
            x1={`${GOLD_GRADIENT_START.x * 100}%`}
            y1={`${GOLD_GRADIENT_START.y * 100}%`}
            x2={`${GOLD_GRADIENT_END.x * 100}%`}
            y2={`${GOLD_GRADIENT_END.y * 100}%`}
          >
            {GOLD_GRADIENT_COLORS.map((color, index) => (
              <Stop
                key={color}
                offset={GOLD_GRADIENT_LOCATIONS[index]}
                stopColor={color}
              />
            ))}
          </SvgLinearGradient>
        ) : null}
        {tier === "expert" ? (
          <SvgLinearGradient id={gradientId} x1="55" y1="15" x2="445" y2="410">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="0.28" stopColor="#CFF7FF" />
            <Stop offset="0.55" stopColor="#70CBE8" />
            <Stop offset="0.78" stopColor="#C7A7FF" />
            <Stop offset="1" stopColor="#FFFFFF" />
          </SvgLinearGradient>
        ) : null}
      </Defs>
      {APP_LOGO_PATHS.map((pathData) => (
        <Path key={pathData} d={pathData} fill={fill} />
      ))}
      <Rect
        x="372.084"
        width="98.2751"
        height="98.2747"
        rx="49.1374"
        transform="rotate(45 372.084 0)"
        fill={fill}
      />
    </Svg>
  );
}

function PlanEmblem({ planName }) {
  const tier = getPlanTier(planName);

  return (
    <View style={styles.planEmblem}>
      <AppLogoIcon tier={tier} />
    </View>
  );
}

export default function SubscriptionCard({
  planName = "No Plan",
  cardStyle,
  contentStyle,
  planLabelStyle,
  benefits = BENEFITS,
  centerBenefits = false,
  showActions = true,
  showBackground = true,
  showDetailsButton = true,
  isSubmitting = false,
  onPress,
  onDetailsPress,
  onUpgradePress,
}) {
  const handleDetailsPress = onDetailsPress || onPress;
  const handleUpgradePress = onUpgradePress || onPress;
  const displayedPlanLabel = planName;
  const primaryActionText = showDetailsButton ? "Upgrade" : "Subscribe";
  const showMemberHeader = showBackground;

  return (
    <View style={[styles.card, !showBackground ? styles.cardPlain : null, cardStyle]}>
      {showBackground ? <BlackGradient /> : null}
      <View style={[styles.content, !showMemberHeader ? styles.plainContent : null, contentStyle]}>
        {showMemberHeader ? (
          <View style={styles.planHeader}>
            <PlanEmblem planName={planName} />
            <View style={styles.planHeadingCopy}>
              <IBMPlexText style={styles.eyebrow}>YOUR PLAN</IBMPlexText>
              <IBMPlexText numberOfLines={1} adjustsFontSizeToFit style={[styles.planLabel, planLabelStyle]}>
                {displayedPlanLabel}
              </IBMPlexText>
            </View>
          </View>
        ) : (
          <View style={styles.plainHeader}>
            <IBMPlexText style={[styles.planLabel, styles.plainPlanLabel, planLabelStyle]}>
              {displayedPlanLabel}
            </IBMPlexText>
          </View>
        )}

        {showActions ? (
          <View style={[styles.actionRow, !showDetailsButton ? styles.actionRowCentered : null]}>
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={handleUpgradePress}
              disabled={isSubmitting}
              style={[styles.actionButton, styles.primaryButton, isSubmitting ? styles.buttonDisabled : null]}
            >
              <GoldGradient />
              <IBMPlexText style={styles.actionButtonText}>{primaryActionText}</IBMPlexText>
            </TouchableOpacity>

            {showDetailsButton ? (
              <TouchableOpacity
                activeOpacity={0.72}
                onPress={handleDetailsPress}
                disabled={isSubmitting}
                style={[styles.detailsButton, isSubmitting ? styles.buttonDisabled : null]}
              >
                <IBMPlexText style={styles.detailsButtonText}>Manage &gt;</IBMPlexText>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.divider, !showMemberHeader ? styles.plainDivider : null]} />

        <View style={styles.benefitsRow}>
          {benefits.map((benefit) => (
            <View
              key={benefit.title}
              style={[styles.benefitItem, centerBenefits ? styles.benefitItemCentered : null]}
            >
              <View style={[styles.benefitIcon, centerBenefits ? styles.benefitIconCentered : null]}>
                <Ionicons
                  color={BENEFIT_ICON_COLOR}
                  name={benefit.icon || "sparkles"}
                  size={25}
                />
              </View>
              <IBMPlexText
                numberOfLines={2}
                adjustsFontSizeToFit
                style={[styles.benefitTitle, centerBenefits ? styles.benefitTextCentered : null]}
              >
                {benefit.title}
              </IBMPlexText>
              <IBMPlexText
                numberOfLines={3}
                style={[styles.benefitDescription, centerBenefits ? styles.benefitTextCentered : null]}
              >
                {benefit.description}
              </IBMPlexText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111111",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#252525",
    overflow: "hidden",
  },
  cardPlain: {
    backgroundColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    overflow: "visible",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  plainContent: {
    paddingHorizontal: 0,
  },
  planHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  planEmblem: {
    alignItems: "center",
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  planHeadingCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: "#9A9AA2",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    lineHeight: 12,
  },
  planLabel: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 25,
    textTransform: "uppercase",
  },
  plainHeader: {
    alignItems: "center",
  },
  plainPlanLabel: {
    textAlign: "center",
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
  },
  actionRowCentered: {
    justifyContent: "center",
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 118,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 10,
    position: "relative",
  },
  primaryButton: {
    backgroundColor: GOLD,
  },
  actionButtonText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
  },
  detailsButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    minHeight: 38,
    paddingHorizontal: 3,
  },
  detailsButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
  },
  divider: {
    backgroundColor: "#252525",
    height: 1,
    marginBottom: 18,
    marginTop: 18,
  },
  plainDivider: {
    marginTop: 22,
  },
  benefitsRow: {
    flexDirection: "row",
    gap: 15,
  },
  benefitItem: {
    flex: 1,
    minWidth: 0,
  },
  benefitItemCentered: {
    alignItems: "center",
  },
  benefitIcon: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    marginBottom: 10,
    width: 28,
  },
  benefitIconCentered: {
    alignSelf: "center",
  },
  benefitTextCentered: {
    textAlign: "center",
  },
  benefitTitle: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  benefitDescription: {
    color: "#9A9AA2",
    fontSize: 9,
    fontWeight: "600",
    lineHeight: 12,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
