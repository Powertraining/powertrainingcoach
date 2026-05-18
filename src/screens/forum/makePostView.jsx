import { useState } from "react";
import { Text, Image, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SearchFiltersView from "./searchFiltersView.jsx";

const COLORS = {
  gold: "#C9B259",
  panel: "#141414",
  panelBorder: "#1E1E1E",
  text: "#ffffff",
  muted: "#9ca3af",
};

export default function MakePostView({
  titleValue = "",
  value = "",
  userPhotoUrl = "",
  isSubmitting = false,
  error = null,
  selectedTags = [],
  onChangeTitle,
  onChangeText,
  onChangeTags,
  onPost,
  onUploadImage,
  onDiscard,
}) {
  const insets = useSafeAreaInsets();
  const [isTagsPickerVisible, setIsTagsPickerVisible] = useState(false);
  const contentTopPadding = Math.max(insets.top + 46, 70);
  const avatarSource =
    userPhotoUrl ?
      { uri: userPhotoUrl } :
      require("../../assets/icons/user.png");
  const normalizedSelectedTags = Array.isArray(selectedTags) ?
    selectedTags.filter(Boolean) :
    [];
  const tagsButtonLabel = normalizedSelectedTags.length > 0 ?
    `Tags (${normalizedSelectedTags.length})` :
    "Tags";

  function toggleTagsPicker() {
    setIsTagsPickerVisible((isVisible) => !isVisible);
  }

  function closeTagsPicker() {
    setIsTagsPickerVisible(false);
  }

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: contentTopPadding }]}>
        <View style={styles.header}>
          <Image source={avatarSource} style={styles.avatar} />
          <TouchableOpacity
            style={styles.tagContainer}
            onPress={toggleTagsPicker}
            disabled={isSubmitting}
          >
            <Text style={styles.tagText}>{tagsButtonLabel}</Text>
          </TouchableOpacity>
        </View>
        <SearchFiltersView
          visible={isTagsPickerVisible}
          filters={{ topics: normalizedSelectedTags }}
          showSortOptions={false}
          contentHorizontalInset={0}
          style={styles.tagsPicker}
          onClose={closeTagsPicker}
          onChangeTopic={onChangeTags}
          onReset={() => onChangeTags?.([])}
        />
        <TextInput
          style={styles.titleInput}
          placeholder="Post title"
          placeholderTextColor={COLORS.muted}
          value={titleValue}
          onChangeText={onChangeTitle}
          editable={!isSubmitting}
          maxLength={140}
          returnKeyType="next"
        />
        <TextInput
          multiline
          style={styles.textInput}
          placeholder="What's on your mind?"
          placeholderTextColor={COLORS.muted}
          value={value}
          onChangeText={onChangeText}
          editable={!isSubmitting}
        />
        <View style={styles.footer}>
          <View style={styles.footerButtons}>
            <TouchableOpacity onPress={onDiscard} disabled={isSubmitting}>
              <Text style={styles.footerButtonText}>Discard</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.footerButtons}>
            <TouchableOpacity onPress={onUploadImage} disabled={isSubmitting}>
              <Text style={styles.footerButtonText}>Image</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.footerButtons}>
            <TouchableOpacity onPress={onPost} disabled={isSubmitting}>
              <Text style={styles.footerButtonText}>
                {isSubmitting ? "Posting..." : "Post"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 40,
  },
  header: {
    height: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 28,
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
    height: 40,
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
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    color: COLORS.text,
    width: "100%",
    flex: 1,
    textAlignVertical: "top",
    textAlign: "left",
  },
  titleInput: {
    borderBottomWidth: 1,
    borderColor: COLORS.panelBorder,
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
    marginBottom: 18,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 12,
  },
  tagsPicker: {
    marginTop: 0,
    marginBottom: 22,
  },
  footer: {
    paddingTop: 15,
    borderColor: COLORS.panelBorder,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerButtons: {
    width: 90,
    height: 38,
    backgroundColor: COLORS.text,
    borderRadius: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  footerButtonText: {
    color: COLORS.panel,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 10,
  },
});
