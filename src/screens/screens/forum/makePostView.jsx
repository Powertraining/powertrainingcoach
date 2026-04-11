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
  const profileSource =
    typeof userPhotoUrl === "string" && userPhotoUrl.trim() ?
      { uri: userPhotoUrl } :
      stockProfileImage;

  return (
    <QuestionnaireShell>
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Image source={profileSource} style={styles.profileImage} />
          <TextInput
            multiline
            value={value}
            onChangeText={onChangeText}
            editable={!isSubmitting}
            placeholder="Write your post"
            placeholderTextColor="#8A8A8A"
            selectionColor="#fff"
            style={styles.input}
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onUploadImage}
            disabled={isSubmitting}
            style={styles.actionButton}
          >
            <StandardText>Upload Image</StandardText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDiscard}
            disabled={isSubmitting}
            style={styles.actionButton}
          >
            <StandardText>Discard</StandardText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPost}
            disabled={isSubmitting}
            style={styles.actionButton}
          >
            <StandardText>{isSubmitting ? "Posting..." : "Post"}</StandardText>
          </TouchableOpacity>
        </View>

        {error ? (
          <StandardText style={styles.errorText}>{error}</StandardText>
        ) : null}
      </View>
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  input: {
    flex: 1,
    minHeight: 160,
    color: "#fff",
    fontFamily: "BebasNeue",
    fontSize: 20,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  actionButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#FF7A7A",
  },
});
