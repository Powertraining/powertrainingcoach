import { Image, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import QuestionnaireShell from "../QuestionnaireShell.jsx";
import StandardText from "../../../components/textComponents/StandardText.jsx";

const stockProfileImage = require("../../../assets/icons/user.png");

export default function MakePostView({
  value = "",
  userPhotoUrl = "",
  isSubmitting = false,
  error = null,
  onChangeText,
  onPost,
  onUploadImage,
  onDiscard,
}) {
  const avatarSource =
    userPhotoUrl ?
      { uri: userPhotoUrl } :
      require("../../../assets/icons/user.png");

  return (
    <View style={styles.container}>
    <TextInput multiline style={styles.textInput} placeholder="What's on your mind?" value={value} onChangeText={onChangeText} />
    <Image source={avatarSource} style={styles.avatar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 30,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
  },
  textInput: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 22,
    color: "#fff",
    width: "100%",
  },
});
