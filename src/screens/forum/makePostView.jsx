import { Text, Image, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import StandardText from "../../components/textComponents/StandardText.jsx";

const stockProfileImage = require("../../assets/icons/user.png");

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
      require("../../assets/icons/user.png");

  return (
    <View style={styles.container}>
    <View style={styles.header}>
      <Image source={avatarSource} style={styles.avatar} />
      <View style={styles.tagContainer}>
        <TouchableOpacity><StandardText  fontSize={20}>Tags</StandardText></TouchableOpacity>
      </View>
    </View>
    <TextInput multiline style={styles.textInput} placeholder="What's on your mind?" value={value} onChangeText={onChangeText} />
    <View style={styles.footer}>
      <View style={styles.footerButtons}>
        <TouchableOpacity onPress={onDiscard}>
          <StandardText fontSize={16} textColor="#000">Discard</StandardText>
        </TouchableOpacity>
      </View>
      <View style={styles.footerButtons}>
        <TouchableOpacity onPress={onUploadImage}>
          <StandardText fontSize={16} textColor="#000">Image</StandardText>
        </TouchableOpacity>
      </View>
      <View style={[styles.footerButtons,{backgroundColor:"#C9B259"}]}>
        <TouchableOpacity onPress={onPost}>
          <StandardText fontSize={16} textColor="#000">Post</StandardText>
        </TouchableOpacity>
      </View>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 40,
  },
  header: {
    height: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: "#fff",
  },
  tagContainer: {
  borderColor: "#fff",
  borderWidth: 1,
  borderRadius: 120,
  height:40,
  justifyContent: "center",
  paddingHorizontal: 20,
  borderStyle: "dashed",
  },
  textInput: {
    marginTop: 28,
    fontSize: 16,
    lineHeight: 22,
    color: "#fff",
    width: "100%",
    height:"86%",
    textAlignVertical: "top",
    textAlign: "left",
  },
  footer: {
    paddingTop: 15,
    borderColor: "#fff",
    borderTopWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",

  },
  footerButtons: {
    width:90,
    height: 38,
    backgroundColor:"#fff",
    borderRadius: 120,
    justifyContent: "center",
    alignItems: "center",
  }
});
