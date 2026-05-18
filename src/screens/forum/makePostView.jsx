import { useState } from "react";
import { Text, Image, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SearchFiltersView from "./searchFiltersView.jsx";

const COLORS = {
  panel: "#141414",
  text: "#ffffff",
  faint: "#8E8E8E",
  error: "#B8B8B8",
};

function TrashIcon() {
  return (
    <View style={styles.trashIcon}>
      <View style={styles.trashIconLid} />
      <View style={styles.trashIconHandle} />
      <View style={styles.trashIconCan}>
        <View style={styles.trashIconLine} />
        <View style={styles.trashIconLine} />
      </View>
    </View>
  );
}

function GalleryIcon() {
  return (
    <View style={styles.galleryIcon}>
      <View style={styles.galleryIconBack} />
      <View style={styles.galleryIconFront}>
        <View style={styles.galleryIconSun} />
        <View style={styles.galleryIconHill} />
      </View>
    </View>
  );
}

function PlusIcon() {
  return (
    <View style={styles.plusIcon}>
      <View style={styles.plusIconHorizontal} />
      <View style={styles.plusIconVertical} />
    </View>
  );
}

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
            style={[
              styles.tagContainer,
              normalizedSelectedTags.length > 0 ? styles.tagContainerActive : null,
            ]}
            onPress={toggleTagsPicker}
            disabled={isSubmitting}
          >
            <Text
              style={[
                styles.tagText,
                normalizedSelectedTags.length > 0 ? styles.tagTextActive : null,
              ]}
            >
              {tagsButtonLabel}
            </Text>
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
          placeholderTextColor={COLORS.faint}
          value={titleValue}
          onChangeText={onChangeTitle}
          editable={!isSubmitting}
          maxLength={140}
          returnKeyType="next"
          selectionColor="#fff"
        />
        <TextInput
          multiline
          style={styles.textInput}
          placeholder="What's on your mind?"
          placeholderTextColor={COLORS.faint}
          value={value}
          onChangeText={onChangeText}
          editable={!isSubmitting}
          selectionColor="#fff"
        />
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onDiscard}
            disabled={isSubmitting}
          >
            <TrashIcon />
            <Text style={styles.secondaryButtonText}>Discard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onUploadImage}
            disabled={isSubmitting}
          >
            <GalleryIcon />
            <Text style={styles.secondaryButtonText}>Image</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting ? styles.disabledButton : null]}
            onPress={onPost}
            disabled={isSubmitting}
          >
            <PlusIcon />
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? "Posting..." : "Post"}
            </Text>
          </TouchableOpacity>
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
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 28,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
  },
  tagContainer: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    maxWidth: "78%",
    paddingHorizontal: 18,
  },
  tagContainerActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  tagText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  tagTextActive: {
    color: COLORS.panel,
  },
  textInput: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    color: COLORS.faint,
    width: "100%",
    flex: 1,
    textAlignVertical: "top",
    textAlign: "left",
  },
  titleInput: {
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
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
    borderColor: "rgba(255,255,255,0.16)",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.text,
    borderRadius: 999,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    height: 38,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: COLORS.panel,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    height: 38,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  disabledButton: {
    opacity: 0.62,
  },
  trashIcon: {
    height: 16,
    position: "relative",
    width: 15,
  },
  trashIconLid: {
    backgroundColor: COLORS.text,
    borderRadius: 999,
    height: 2,
    left: 1,
    position: "absolute",
    top: 4,
    width: 13,
  },
  trashIconHandle: {
    borderColor: COLORS.text,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderTopWidth: 2,
    height: 4,
    left: 5,
    position: "absolute",
    top: 1,
    width: 5,
  },
  trashIconCan: {
    alignItems: "center",
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    borderColor: COLORS.text,
    borderLeftWidth: 1.7,
    borderRightWidth: 1.7,
    borderBottomWidth: 1.7,
    flexDirection: "row",
    gap: 2,
    height: 10,
    justifyContent: "center",
    left: 2,
    position: "absolute",
    top: 6,
    width: 11,
  },
  trashIconLine: {
    backgroundColor: COLORS.text,
    borderRadius: 999,
    height: 7,
    opacity: 0.85,
    width: 1.4,
  },
  galleryIcon: {
    height: 16,
    position: "relative",
    width: 17,
  },
  galleryIconBack: {
    borderColor: COLORS.text,
    borderRadius: 3,
    borderWidth: 1.5,
    height: 11,
    left: 3,
    opacity: 0.55,
    position: "absolute",
    top: 1,
    width: 13,
  },
  galleryIconFront: {
    borderColor: COLORS.text,
    borderRadius: 3,
    borderWidth: 1.5,
    height: 12,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    top: 4,
    width: 14,
  },
  galleryIconSun: {
    backgroundColor: COLORS.text,
    borderRadius: 2,
    height: 3,
    position: "absolute",
    right: 2,
    top: 2,
    width: 3,
  },
  galleryIconHill: {
    backgroundColor: COLORS.text,
    height: 7,
    left: 2,
    position: "absolute",
    top: 8,
    transform: [{ rotate: "45deg" }],
    width: 9,
  },
  plusIcon: {
    height: 15,
    position: "relative",
    width: 15,
  },
  plusIconHorizontal: {
    backgroundColor: COLORS.panel,
    borderRadius: 999,
    height: 2,
    left: 2,
    position: "absolute",
    top: 6.5,
    width: 11,
  },
  plusIconVertical: {
    backgroundColor: COLORS.panel,
    borderRadius: 999,
    height: 11,
    left: 6.5,
    position: "absolute",
    top: 2,
    width: 2,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 10,
  },
});
