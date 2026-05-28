import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import Comment from "../../components/forumComponents/Comment.jsx";
import LockIcon from "../../components/LockIcon.jsx";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
const COLORS = {
  panel: "#141414",
  panelBorder: "#1E1E1E",
  text: "#ffffff",
  muted: "#9ca3af",
  error: "#fca5a5",
};
const COMMENT_SKELETONS = [0, 1, 2, 3];

function SkeletonBlock({ style }) {
  return <View style={[styles.skeletonBlock, style]} />;
}

function CommentSkeleton({ index = 0 }) {
  return (
    <View style={styles.commentSkeleton}>
      <SkeletonBlock style={styles.commentSkeletonAvatar} />
      <View style={styles.commentSkeletonBody}>
        <SkeletonBlock
          style={[
            styles.commentSkeletonAuthor,
            index % 2 ? styles.commentSkeletonAuthorShort : null,
          ]}
        />
        <SkeletonBlock style={styles.commentSkeletonLineLong} />
        <SkeletonBlock
          style={[
            styles.commentSkeletonLine,
            index % 2 ? styles.commentSkeletonLineShort : null,
          ]}
        />
      </View>
    </View>
  );
}

export default function CommentsView({
  onClose,
  comments = [],
  commentValue = "",
  commentError = null,
  replyValue = "",
  replyError = null,
  currentUserPhotoUrl = "",
  isSubmittingComment = false,
  isSubmittingReply = false,
  isCommentsLoading = false,
  commentsLocked = false,
  onChangeCommentText,
  onCreateComment,
  onPressReply,
  onChangeReplyText,
  onCreateReply,
  onCancelReply,
}) {
  const [replyTargetComment, setReplyTargetComment] = useState(null);
  const wasSubmittingReplyRef = useRef(false);
  const avatarSource =
    currentUserPhotoUrl ?
      { uri: currentUserPhotoUrl } :
      require("../../assets/icons/user.png");
  const isReplyComposer = Boolean(replyTargetComment);
  const composerValue = isReplyComposer ? replyValue : commentValue;
  const composerError = isReplyComposer ? replyError : commentError;
  const isSubmittingComposer = isReplyComposer ? isSubmittingReply : isSubmittingComment;
  const isComposerDisabled = isSubmittingComposer || commentsLocked;
  const replyTargetAvatarSource =
    replyTargetComment?.authorAvatarUrl ?
      { uri: replyTargetComment.authorAvatarUrl } :
      require("../../assets/icons/user.png");

  useEffect(() => {
    if (
      wasSubmittingReplyRef.current &&
      !isSubmittingReply &&
      replyTargetComment &&
      !replyError
    ) {
      setReplyTargetComment(null);
    }

    wasSubmittingReplyRef.current = isSubmittingReply;
  }, [isSubmittingReply, replyError, replyTargetComment]);

  function handleClose() {
    setReplyTargetComment(null);
    onCancelReply?.();
    onClose?.();
  }

  function handlePressReply(comment) {
    if (!comment) {
      return;
    }

    if (commentsLocked) {
      return;
    }

    setReplyTargetComment(comment);
    onPressReply?.(comment);
  }

  function handleChangeComposerText(value) {
    if (commentsLocked) {
      return;
    }

    if (isReplyComposer) {
      onChangeReplyText?.(value);
      return;
    }

    onChangeCommentText?.(value);
  }

  function handleSubmitComposer() {
    if (commentsLocked) {
      return;
    }

    if (isReplyComposer) {
      onCreateReply?.();
      return;
    }

    onCreateComment?.();
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.content}>
          {isReplyComposer ? (
            <View style={styles.replyTargetPreview}>
              <Image source={replyTargetAvatarSource} style={styles.replyTargetAvatar} />
              <View style={styles.replyTargetTextContent}>
                <IBMPlexText numberOfLines={1} style={styles.replyTargetName}>
                  {replyTargetComment?.authorDisplayName}
                </IBMPlexText>
                <IBMPlexText numberOfLines={3} style={styles.replyTargetBody}>
                  {replyTargetComment?.body}
                </IBMPlexText>
              </View>
            </View>
          ) : null}
          <View style={styles.commentComposer}>
            <Image source={avatarSource} style={styles.commentAvatar} />
            <View style={styles.commentComposerBody}>
              {commentsLocked ? (
                <View style={styles.lockedComposerPreviewWrap}>
                  <View style={styles.lockedComposerPreview}>
                    <View style={styles.lockedComposerLineLong} />
                    <View style={styles.lockedComposerLine} />
                  </View>
                  <View pointerEvents="none" style={styles.lockedComposerInlineOverlay}>
                    <LockIcon size={16} style={styles.lockedComposerInlineIcon} />
                    <IBMPlexText style={styles.lockedComposerInlineText}>
                      Members only, so coaches can ensure safety and quality.
                    </IBMPlexText>
                  </View>
                </View>
              ) : (
                <TextInput
                  multiline
                  value={composerValue}
                  onChangeText={handleChangeComposerText}
                  editable={!isComposerDisabled}
                  placeholder={isReplyComposer ? "Write a reply" : "Write a comment"}
                  placeholderTextColor={COLORS.muted}
                  selectionColor="#fff"
                  style={styles.commentInput}
                />
              )}
              <TouchableOpacity
                style={[
                  styles.commentSubmitButton,
                  commentsLocked ? styles.commentSubmitButtonLocked : null,
                ]}
                onPress={handleSubmitComposer}
                disabled={isComposerDisabled}
              >
                {commentsLocked ? (
                  <LockIcon size={16} />
                ) : (
                  <IBMPlexText style={styles.commentSubmitButtonText}>
                    {isSubmittingComposer ?
                      "Posting..." :
                      isReplyComposer ? "Post Reply" : "Post Comment"}
                  </IBMPlexText>
                )}
              </TouchableOpacity>
              {composerError ? (
                <IBMPlexText style={styles.commentError}>{composerError}</IBMPlexText>
              ) : null}
            </View>
          </View>
          <ScrollView
            style={styles.commentsList}
            contentContainerStyle={styles.commentsListContent}
            showsVerticalScrollIndicator={false}
          >
            {isCommentsLoading ? (
              COMMENT_SKELETONS.map((item) => (
                <CommentSkeleton
                  key={`comments-modal-skeleton-${item}`}
                  index={item}
                />
              ))
            ) : (
              comments.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  onPressReply={commentsLocked ? undefined : handlePressReply}
                />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    opacity: 0.75,
  },
  content: {
    width: "85%",
    height: "75%",
    backgroundColor: COLORS.panel,
    borderColor: COLORS.panelBorder,
    borderWidth: 2,
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 40,
  },
  commentComposer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2A2A2A",
  },
  commentComposerBody: {
    flex: 1,
    gap: 10,
  },
  commentInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    textAlignVertical: "top",
  },
  lockedComposerPreviewWrap: {
    minHeight: 90,
    position: "relative",
  },
  lockedComposerPreview: {
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    minHeight: 90,
    opacity: 0.42,
    paddingHorizontal: 14,
    paddingVertical: 16,
    filter: [{ blur: 3 }],
  },
  lockedComposerInlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(12, 12, 12, 0.5)",
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  lockedComposerInlineIcon: {
    flexShrink: 0,
  },
  lockedComposerInlineText: {
    color: "#C9B259",
    flexShrink: 1,
    fontSize: 11, fontWeight: "700",
    lineHeight: 15,
  },
  lockedComposerLineLong: {
    backgroundColor: COLORS.text,
    borderRadius: 4,
    height: 12,
    opacity: 0.72,
    width: "76%",
  },
  lockedComposerLine: {
    backgroundColor: COLORS.muted,
    borderRadius: 4,
    height: 12,
    opacity: 0.62,
    width: "54%",
  },
  commentSubmitButton: {
    alignSelf: "flex-start",
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 120,
    backgroundColor: COLORS.text,
    justifyContent: "center",
    alignItems: "center",
  },
  commentSubmitButtonLocked: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    width: 48,
  },
  commentSubmitButtonText: {
    color: COLORS.panel,
    fontSize: 12, fontWeight: "800",
    lineHeight: 16,
  },
  commentError: {
    color: COLORS.error,
    fontSize: 12, fontWeight: "700",
    lineHeight: 17,
  },
  replyTargetPreview: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.14)",
  },
  replyTargetAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2A2A2A",
  },
  replyTargetTextContent: {
    flex: 1,
    gap: 5,
  },
  replyTargetName: {
    color: COLORS.text,
    flexShrink: 1,
    fontSize: 14, fontWeight: "800",
    lineHeight: 18,
  },
  replyTargetBody: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
  },
  commentsList: {
    flex: 1,
    marginTop: 20,
    marginHorizontal: -40,
  },
  commentsListContent: {
    paddingBottom: 12,
  },
  skeletonBlock: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
  },
  commentSkeleton: {
    borderBottomColor: "rgba(255,255,255,0.1)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  commentSkeletonAvatar: {
    backgroundColor: "rgba(255,255,255,0.18)",
    height: 36,
    width: 36,
  },
  commentSkeletonBody: {
    flex: 1,
    gap: 10,
    minWidth: 0,
    paddingTop: 2,
  },
  commentSkeletonAuthor: {
    backgroundColor: "rgba(255,255,255,0.2)",
    height: 13,
    width: "42%",
  },
  commentSkeletonAuthorShort: {
    width: "30%",
  },
  commentSkeletonLineLong: {
    height: 12,
    width: "88%",
  },
  commentSkeletonLine: {
    height: 12,
    width: "66%",
  },
  commentSkeletonLineShort: {
    width: "48%",
  },
});
