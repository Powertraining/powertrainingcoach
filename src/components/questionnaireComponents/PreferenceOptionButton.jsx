import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";
export default function PreferenceOptionButton({
  label,
  isSelected,
  onPress,
  onPressIn,
  onPressOut,
  imageSource,
  imageStyle,
  icon,
  mediaText,
  selectedButtonStyle,
  buttonStyle,
  labelStyle,
  mediaTextStyle,
  description,
  descriptionStyle,
  badge,
  badgeStyle,
  badgeTextStyle,
  stacked = false,
}) {
  const hasDescription = Boolean(description);
  const hasBadge = Boolean(badge);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.button,
        hasDescription ? styles.buttonWithDescription : null,
        isSelected ? styles.buttonSelected : null,
        buttonStyle,
        isSelected ? selectedButtonStyle : null,
      ]}
    >
      <View style={[styles.content, stacked ? styles.contentStacked : null]}>
        {icon ? (
          <View style={[styles.iconSlot, stacked ? styles.iconSlotStacked : null]}>
            {icon}
          </View>
        ) : imageSource ? (
          <Image
            source={imageSource}
            style={[
              styles.image,
              stacked ? styles.imageStacked : null,
              imageStyle,
            ]}
            resizeMode="contain"
          />
        ) : mediaText ? (
          <IBMPlexText defaultWhite
            style={[
              styles.mediaText,
              hasDescription ? styles.mediaTextWithDescription : null,
              mediaTextStyle,
            ]}
            textColor="#ffffff"
            center
          >
            {mediaText}
          </IBMPlexText>
        ) : null}
        {hasBadge ? (
          <View style={[styles.badge, badgeStyle]}>
            <IBMPlexText style={[styles.badgeText, badgeTextStyle]}>{badge}</IBMPlexText>
          </View>
        ) : null}
        <IBMPlexText defaultWhite
          fontSize={14}
          lines={stacked ? 2 : undefined}
          style={[
            styles.label,
            stacked ? styles.labelStacked : null,
            hasDescription ? styles.labelWithDescription : null,
            labelStyle,
          ]}
          textColor="#ffffff"
          center
        >
          {label}
        </IBMPlexText>
        {hasDescription ? (
          <IBMPlexText
            numberOfLines={2}
            style={[styles.description, descriptionStyle]}
          >
            {description}
          </IBMPlexText>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#121212",
    borderColor: "#2D2D2D",
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    height: 110,
    justifyContent: "center",
    position: "relative",
    width: "75%",
  },
  buttonWithDescription: {
    height: 124,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonSelected: {
    borderColor: "#ffffff",
    borderStyle: "solid",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  contentStacked: {
    gap: 10,
    paddingHorizontal: 12,
  },
  badge: {
    alignItems: "center",
    borderColor: "#C9B259",
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 6,
    marginTop: -2,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: "#C9B259",
    fontSize: 10, fontWeight: "800",
    textTransform: "uppercase",
  },
  image: {
    height: 42,
    marginBottom: 18,
    width: 42,
  },
  imageStacked: {
    marginBottom: 0,
  },
  iconSlot: {
    marginBottom: 18,
  },
  iconSlotStacked: {
    marginBottom: 0,
  },
  mediaText: {
    fontSize: 34,
    marginBottom: 18,
  },
  mediaTextWithDescription: {
    fontSize: 28,
    marginBottom: 8,
  },
  label: {
    bottom: 8,
    position: "absolute",
    width: "100%",
  },
  labelStacked: {
    bottom: "auto",
    lineHeight: 18,
    minHeight: 36,
    position: "relative",
  },
  labelWithDescription: {
    bottom: "auto",
    position: "relative",
  },
  description: {
    color: "#8E8E8E",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
    textAlign: "center",
    width: "100%",
  },
});
