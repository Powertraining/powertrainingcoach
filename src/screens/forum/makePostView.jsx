import { Text, Image, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

const COLORS = {
  gold: "#C9B259",
  panel: "#141414",
  panelBorder: "#1E1E1E",
  text: "#ffffff",
  muted: "#9ca3af",
};

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
        <TouchableOpacity>
          <Text style={styles.tagText}>Tags</Text>
        </TouchableOpacity>
      </View>
    </View>
    <TextInput
      multiline
      style={styles.textInput}
      placeholder="What's on your mind?"
      placeholderTextColor={COLORS.muted}
      value={value}
      onChangeText={onChangeText}
    />
    <View style={styles.footer}>
      <View style={styles.footerButtons}>
        <TouchableOpacity onPress={onDiscard}>
          <Text style={styles.footerButtonText}>Discard</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footerButtons}>
        <TouchableOpacity onPress={onUploadImage}>
          <Text style={styles.footerButtonText}>Image</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footerButtons}>
        <TouchableOpacity onPress={onPost}>
          <Text style={styles.footerButtonText}>Post</Text>
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
  borderColor: "rgba(255,255,255,0.48)",
  borderWidth: 1,
  borderRadius: 120,
  height:40,
  justifyContent: "center",
  paddingHorizontal: 20,
  borderStyle: "dashed",
  },
  tagText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  textInput: {
    marginTop: 28,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    color: COLORS.text,
    width: "100%",
    height:"86%",
    textAlignVertical: "top",
    textAlign: "left",
  },
  footer: {
    paddingTop: 15,
    borderColor: COLORS.panelBorder,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",

  },
  footerButtons: {
    width:90,
    height: 38,
    backgroundColor:COLORS.text,
    borderRadius: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  footerButtonText: {
    color: COLORS.panel,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  }
});
