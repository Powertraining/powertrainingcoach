import { TouchableOpacity, Image } from "react-native";

const googleIcon = require("../../assets/icons/google.png");
const googleIconSource = Image.resolveAssetSource(googleIcon);
const googleIconAspectRatio =
  googleIconSource?.width && googleIconSource?.height
    ? googleIconSource.width / googleIconSource.height
    : 1;

export default function GoogleButtonComponent({ onPress, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        borderWidth: 2,
        borderColor: "#585858",
        borderRadius: 120,
        marginHorizontal: 20,
        height: 70,
        paddingHorizontal: 14,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 15,
      }}
    >
      <Image
        source={googleIcon}
        resizeMode="contain"
        style={{ height: 23, aspectRatio: googleIconAspectRatio }}
      />
    </TouchableOpacity>
  );
}
