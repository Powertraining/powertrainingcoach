import {
  useEffect,
  useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SearchFiltersView from "./searchFiltersView.jsx";
import LockIcon from "../../components/LockIcon.jsx";
import { reactiveModel } from "../../services/models/mobxReactiveModel.js";
import { useVideoPlayer, VideoView } from "expo-video";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
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

function VideoPosterPreview({ uri }) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.muted = true;
  });

  return (
    <VideoView
      allowsPictureInPicture={false}
      contentFit="cover"
      nativeControls={false}
      player={player}
      pointerEvents="none"
      style={styles.mediaStatusImage}
    />
  );
}

function MediaButton({
  mediaUrl = "",
  mediaType = "none",
  previewMediaUrl = "",
  previewMediaType = "none",
  isUploading = false,
  isMenuVisible = false,
  disabled = false,
  onPress,
  onPickImage,
  onPickVideo,
  onRemove,
  showImageOption = true,
  showVideoOption = true,
}) {
  const displayMediaUrl = previewMediaUrl || mediaUrl;
  const displayMediaType = previewMediaUrl ? previewMediaType : mediaType;
  const hasMedia = Boolean(displayMediaUrl && displayMediaType !== "none");

  return (
    <View style={styles.mediaButtonWrap}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onPress}
        disabled={disabled}
        style={[styles.mediaStatusPreview, disabled ? styles.mediaStatusPreviewDisabled : null]}
      >
        {hasMedia && displayMediaType === "image" ? (
          <Image
            source={{ uri: displayMediaUrl }}
            resizeMode="cover"
            style={styles.mediaStatusImage}
          />
        ) : hasMedia && displayMediaType === "video" ? (
          <View style={styles.mediaStatusVideoWrap}>
            <VideoPosterPreview uri={displayMediaUrl} />
            <View style={styles.mediaStatusVideoBadge}>
              <View style={styles.mediaStatusPlayIcon} />
            </View>
          </View>
        ) : isUploading ? (
          <ActivityIndicator color={COLORS.faint} size="small" />
        ) : (
          <GalleryIcon />
        )}
        {isUploading && hasMedia ? (
          <View style={styles.mediaStatusUploadingOverlay}>
            <ActivityIndicator color={COLORS.text} size="small" />
          </View>
        ) : null}
      </TouchableOpacity>
      {isMenuVisible ? (
        <View style={styles.mediaMenu}>
          <View style={styles.mediaMenuPointer} />
          {showImageOption ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onPickImage}
              style={[styles.mediaMenuOption, styles.mediaMenuOptionPrimary]}
            >
              <IBMPlexText style={[styles.mediaMenuOptionText, styles.mediaMenuOptionTextPrimary]}>
                Photo
              </IBMPlexText>
            </TouchableOpacity>
          ) : null}
          {showVideoOption ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onPickVideo}
              style={[
                styles.mediaMenuOption,
                !showImageOption ? styles.mediaMenuOptionPrimary : null,
              ]}
            >
              <IBMPlexText
                style={[
                  styles.mediaMenuOptionText,
                  !showImageOption ? styles.mediaMenuOptionTextPrimary : null,
                ]}
              >
                Video
              </IBMPlexText>
            </TouchableOpacity>
          ) : null}
          {hasMedia ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onRemove}
              style={styles.mediaMenuOption}
            >
              <IBMPlexText style={styles.mediaMenuOptionText}>Remove</IBMPlexText>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function LockedComposePreview({ avatarSource }) {
  return (
    <>
      <View style={styles.header}>
        <Image source={avatarSource} style={styles.avatar} />
        <View style={styles.lockedTagPlaceholder} />
      </View>
      <View style={styles.lockedTitlePlaceholder} />
      <View style={styles.lockedBodyPreview}>
        <View style={styles.lockedBodyLineLong} />
        <View style={styles.lockedBodyLine} />
        <View style={styles.lockedBodyLineMedium} />
      </View>
      <View style={styles.footer}>
        <View style={styles.lockedFooterButton} />
        <View style={[styles.lockedFooterButton, styles.lockedFooterButtonPrimary]} />
      </View>
    </>
  );
}

export default function MakePostView({
  titleValue = "",
  value = "",
  userPhotoUrl = "",
  mediaUrl = "",
  mediaType = "none",
  previewMediaUrl = "",
  previewMediaType = "none",
  isUploadingMedia = false,
  isSubmitting = false,
  error = null,
  selectedTags = [],
  locked = false,
  onChangeTitle,
  onChangeText,
  onChangeTags,
  onPost,
  onUploadImage,
  onUploadVideo,
  onRemoveMedia,
  allowImageUpload = true,
  allowVideoUpload = true,
  allowAnalysisTag = false,
  onBack,
  onDiscard,
}) {
  const insets = useSafeAreaInsets();
  const [isTagsPickerVisible, setIsTagsPickerVisible] = useState(false);
  const [isMediaMenuVisible, setIsMediaMenuVisible] = useState(false);
  const contentTopPadding = !locked && onBack ? 26 : Math.max(insets.top + 46, 70);
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
  const isDraftEditingDisabled = isSubmitting || locked;
  const isUploadActionDisabled = isSubmitting || isUploadingMedia || locked;
  const isPostActionDisabled = isSubmitting || isUploadingMedia || locked;
  const hasMedia = Boolean(mediaUrl && mediaType !== "none");

  useEffect(() => {
    reactiveModel.setForumTabBarHidden(true);

    return () => {
      reactiveModel.setForumTabBarHidden(false);
    };
  }, []);

  function toggleTagsPicker() {
    setIsMediaMenuVisible(false);
    setIsTagsPickerVisible((isVisible) => !isVisible);
  }

  function closeTagsPicker() {
    setIsTagsPickerVisible(false);
  }

  function handlePressMediaButton() {
    closeTagsPicker();

    if (isUploadActionDisabled) {
      return;
    }

    setIsMediaMenuVisible((isVisible) => !isVisible);
  }

  function handlePickImage() {
    setIsMediaMenuVisible(false);
    onUploadImage?.();
  }

  function handlePickVideo() {
    setIsMediaMenuVisible(false);
    onUploadVideo?.();
  }

  function handleRemoveMedia() {
    setIsMediaMenuVisible(false);
    onRemoveMedia?.();
  }

  return (
    <View style={styles.container}>
      {!locked && onBack ? (
        <TouchableOpacity
          onPress={onBack}
          disabled={isSubmitting}
          style={styles.backButton}
        >
          <IBMPlexText style={styles.backButtonText}>Go Back</IBMPlexText>
        </TouchableOpacity>
      ) : null}
      <View
        style={[
          styles.content,
          locked ? styles.lockedContent : null,
          { paddingTop: contentTopPadding },
        ]}
      >
        {locked ? (
          <LockedComposePreview avatarSource={avatarSource} />
        ) : (
          <>
        <View style={styles.header}>
          <Image source={avatarSource} style={styles.avatar} />
          <View style={styles.headerControls}>
            <TouchableOpacity
              style={[
                styles.tagContainer,
                normalizedSelectedTags.length > 0 ? styles.tagContainerActive : null,
              ]}
              onPress={toggleTagsPicker}
              disabled={isDraftEditingDisabled}
            >
              <IBMPlexText
                numberOfLines={1}
                style={[
                  styles.tagText,
                  normalizedSelectedTags.length > 0 ? styles.tagTextActive : null,
                ]}
              >
                {tagsButtonLabel}
              </IBMPlexText>
            </TouchableOpacity>
            <MediaButton
              mediaUrl={mediaUrl}
              mediaType={mediaType}
              previewMediaUrl={previewMediaUrl}
              previewMediaType={previewMediaType}
              isUploading={isUploadingMedia}
              isMenuVisible={isMediaMenuVisible}
              disabled={isUploadActionDisabled}
              onPress={handlePressMediaButton}
              onPickImage={handlePickImage}
              onPickVideo={handlePickVideo}
              onRemove={handleRemoveMedia}
              showImageOption={allowImageUpload}
              showVideoOption={allowVideoUpload}
            />
          </View>
        </View>
        <SearchFiltersView
          visible={isTagsPickerVisible}
          filters={{ topics: normalizedSelectedTags }}
          showSortOptions={false}
          showAnalysisTopic={allowAnalysisTag}
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
          editable={!isDraftEditingDisabled}
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
          editable={!isDraftEditingDisabled}
          selectionColor="#fff"
        />
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onDiscard}
            disabled={isSubmitting}
          >
            <TrashIcon />
            <IBMPlexText style={styles.secondaryButtonText}>Discard</IBMPlexText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, isPostActionDisabled ? styles.disabledButton : null]}
            onPress={onPost}
            disabled={isPostActionDisabled}
          >
            <PlusIcon />
            <IBMPlexText style={styles.primaryButtonText}>
              {isSubmitting ? "Posting..." : "Post"}
            </IBMPlexText>
          </TouchableOpacity>
        </View>
        {error ? (
          <IBMPlexText style={styles.errorText}>{error}</IBMPlexText>
        ) : null}
          </>
        )}
      </View>
      {locked ? (
        <View style={styles.lockedOverlay}>
          <View style={styles.lockedMessageCard}>
            <LockIcon size={24} />
            <IBMPlexText style={styles.lockedMessageTitle}>Posting is locked</IBMPlexText>
            <IBMPlexText style={styles.lockedMessageText}>
              Posting is available to subscribed members so coaches can keep up with discussions, give useful feedback, and maintain a safe training space.
            </IBMPlexText>
            <TouchableOpacity
              style={styles.lockedBackButton}
              onPress={onBack || onDiscard}
            >
              <IBMPlexText style={styles.lockedBackButtonText}>Go Back</IBMPlexText>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
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
  lockedContent: {
    opacity: 0.42,
    filter: [{ blur: 3 }],
  },
  header: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 28,
  },
  headerControls: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minWidth: 0,
    position: "relative",
    zIndex: 5,
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
    flexShrink: 1,
    maxWidth: "100%",
    paddingHorizontal: 18,
  },
  tagContainerActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  tagText: {
    color: COLORS.text,
    fontSize: 12, fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  mediaButtonWrap: {
    position: "relative",
    zIndex: 8,
  },
  mediaStatusPreview: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    overflow: "hidden",
    width: 40,
  },
  mediaStatusUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
    justifyContent: "center",
  },
  mediaStatusPreviewDisabled: {
    opacity: 0.62,
  },
  mediaStatusImage: {
    height: "100%",
    width: "100%",
  },
  mediaStatusVideoWrap: {
    height: "100%",
    position: "relative",
    width: "100%",
  },
  mediaStatusVideoBadge: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.54)",
    borderRadius: 999,
    height: 20,
    justifyContent: "center",
    left: 9,
    position: "absolute",
    top: 9,
    width: 20,
  },
  mediaStatusPlayIcon: {
    borderBottomColor: "transparent",
    borderBottomWidth: 5,
    borderLeftColor: COLORS.text,
    borderLeftWidth: 7,
    borderTopColor: "transparent",
    borderTopWidth: 5,
    height: 0,
    marginLeft: 2,
    width: 0,
  },
  mediaMenu: {
    backgroundColor: COLORS.panel,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 4,
    position: "absolute",
    right: 0,
    top: 48,
    width: 112,
    zIndex: 20,
  },
  mediaMenuPointer: {
    backgroundColor: COLORS.panel,
    borderLeftColor: "rgba(255,255,255,0.2)",
    borderTopColor: "rgba(255,255,255,0.2)",
    borderLeftWidth: 1,
    borderTopWidth: 1,
    height: 12,
    position: "absolute",
    right: 14,
    top: -7,
    transform: [{ rotate: "45deg" }],
    width: 12,
  },
  mediaMenuOption: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 8,
  },
  mediaMenuOptionPrimary: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  mediaMenuOptionText: {
    color: COLORS.text,
    fontSize: 13, fontWeight: "800",
    lineHeight: 17,
  },
  mediaMenuOptionTextPrimary: {
    color: COLORS.panel,
  },
  tagTextActive: {
    color: COLORS.panel,
  },
  textInput: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 15,
    fontWeight: "400",
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
    fontFamily: "IBMPlexSans_700Bold",
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
  lockedTagPlaceholder: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    width: 112,
  },
  lockedTitlePlaceholder: {
    backgroundColor: COLORS.text,
    borderRadius: 4,
    height: 20,
    marginBottom: 24,
    opacity: 0.72,
    width: "72%",
  },
  lockedBodyPreview: {
    flex: 1,
    gap: 12,
    paddingTop: 4,
    width: "100%",
  },
  lockedBodyLineLong: {
    backgroundColor: COLORS.faint,
    borderRadius: 4,
    height: 12,
    opacity: 0.74,
    width: "92%",
  },
  lockedBodyLine: {
    backgroundColor: COLORS.faint,
    borderRadius: 4,
    height: 12,
    opacity: 0.68,
    width: "78%",
  },
  lockedBodyLineMedium: {
    backgroundColor: COLORS.faint,
    borderRadius: 4,
    height: 12,
    opacity: 0.62,
    width: "56%",
  },
  footer: {
    paddingTop: 15,
    borderColor: "rgba(255,255,255,0.16)",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    zIndex: 1,
  },
  lockedFooterButton: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    height: 38,
  },
  lockedFooterButtonPrimary: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
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
    fontSize: 12, fontWeight: "800",
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
    fontSize: 12, fontWeight: "800",
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
    width: 16,
  },
  galleryIconFront: {
    borderColor: COLORS.text,
    borderRadius: 3,
    borderWidth: 1.5,
    height: 12,
    left: 1,
    overflow: "hidden",
    position: "absolute",
    top: 2,
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
    top: 7,
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
    fontSize: 12, fontWeight: "700",
    lineHeight: 17,
    marginTop: 10,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 24,
    paddingBottom: 8,
    paddingTop: 18,
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 14, fontWeight: "800",
    lineHeight: 18,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(12, 12, 12, 0.58)",
    justifyContent: "center",
    paddingHorizontal: 28,
    zIndex: 10,
  },
  lockedMessageCard: {
    alignItems: "center",
    gap: 10,
    maxWidth: 340,
  },
  lockedMessageTitle: {
    color: COLORS.text,
    fontSize: 28, fontWeight: "700",
    lineHeight: 34,
    textAlign: "center",
  },
  lockedMessageText: {
    color: "#C9B259",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  lockedBackButton: {
    alignItems: "center",
    backgroundColor: COLORS.text,
    borderRadius: 999,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 34,
    paddingHorizontal: 18,
  },
  lockedBackButtonText: {
    color: COLORS.panel,
    fontSize: 12, fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
});
