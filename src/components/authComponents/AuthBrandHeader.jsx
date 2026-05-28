import { StyleSheet, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

import IBMPlexText from "../textComponents/IBMPlexText.jsx";
import { fonts } from "../../theme/colors.js";

function LogoMark() {
  return (
    <Svg width={42} height={36} viewBox="0 0 497 426" fill="none">
      <Path d="M226.135 150.142C233.946 142.332 246.609 142.332 254.419 150.142L274.997 170.719C282.807 178.53 282.807 191.193 274.997 199.004L93.2808 380.72C68.7485 405.252 28.9737 405.252 4.44148 380.72C1.98825 378.267 1.98825 374.289 4.44148 371.836L226.135 150.142Z" fill="#ffffff" />
      <Path d="M285.073 207.142C292.883 199.332 305.546 199.332 313.357 207.142L331.398 225.183C337.276 231.061 337.276 240.592 331.398 246.47L263.897 313.972C242.394 335.474 207.532 335.474 186.03 313.972C183.88 311.821 183.88 308.335 186.03 306.185L285.073 207.142Z" fill="#ffffff" />
      <Path d="M452.088 122.934C454.138 120.884 457.463 120.884 459.514 122.934C480.019 143.44 480.019 176.686 459.514 197.192L446.012 210.694C443.215 213.49 438.682 213.49 435.886 210.694L414.249 189.057C406.438 181.247 406.438 168.584 414.249 160.773L452.088 122.934Z" fill="#ffffff" />
      <Rect x="372.084" width="98.2751" height="98.2747" rx="49.1374" transform="rotate(45 372.084 0)" fill="#ffffff" />
      <Path d="M206.628 87.1104C204.275 84.7572 204.275 80.942 206.628 78.5888C230.16 55.0572 268.312 55.0571 291.844 78.5888L430.344 217.09C432.698 219.443 432.698 223.258 430.344 225.611C406.813 249.143 368.66 249.143 345.129 225.611L206.628 87.1104Z" fill="#ffffff" />
      <Path d="M181.497 181.179C179.486 183.19 176.225 183.19 174.214 181.179C154.105 161.07 154.105 128.467 174.214 108.358L188.33 94.2421C191.121 91.4516 195.645 91.4516 198.435 94.2421L220 115.806C227.42 123.226 227.42 135.256 220 142.676L181.497 181.179Z" fill="#ffffff" />
    </Svg>
  );
}

export default function AuthBrandHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <LogoMark />
        <IBMPlexText
          numberOfLines={1}
          adjustsFontSizeToFit
          style={styles.brandText}
        >
          POWERTRAINING
        </IBMPlexText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    height: 190,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    maxWidth: "100%",
  },
  brandText: {
    color: "#ffffff",
    flexShrink: 1,
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 27,
  },
});
