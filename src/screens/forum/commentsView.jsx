import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import Comment from "../../components/forumComponents/Comment.jsx";

const COLORS = {
  panel: "#141414",
  panelBorder: "#1E1E1E",
  text: "#ffffff",
  muted: "#9ca3af",
  error: "#fca5a5",
};

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

    setReplyTargetComment(comment);
    onPressReply?.(comment);
  }

  function handleChangeComposerText(value) {
    if (isReplyComposer) {
      onChangeReplyText?.(value);
      return;
    }

    onChangeCommentText?.(value);
  }

  function handleSubmitComposer() {
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
                <Text numberOfLines={1} style={styles.replyTargetName}>
                  {replyTargetComment?.authorDisplayName}
                </Text>
                <Text numberOfLines={3} style={styles.replyTargetBody}>
                  {replyTargetComment?.body}
                </Text>
              </View>
            </View>
          ) : null}
          <View style={styles.commentComposer}>
            <Image source={avatarSource} style={styles.commentAvatar} />
            <View style={styles.commentComposerBody}>
              <TextInput
                multiline
                value={composerValue}
                onChangeText={handleChangeComposerText}
                editable={!isSubmittingComposer}
                placeholder={isReplyComposer ? "Write a reply" : "Write a comment"}
                placeholderTextColor={COLORS.muted}
                selectionColor="#fff"
                style={styles.commentInput}
              />
              <TouchableOpacity
                style={styles.commentSubmitButton}
                onPress={handleSubmitComposer}
                disabled={isSubmittingComposer}
              >
                <Text style={styles.commentSubmitButtonText}>
                  {isSubmittingComposer ?
                    "Posting..." :
                    isReplyComposer ? "Post Reply" : "Post Comment"}
                </Text>
              </TouchableOpacity>
              {composerError ? (
                <Text style={styles.commentError}>{composerError}</Text>
              ) : null}
            </View>
          </View>
          <ScrollView
            style={styles.commentsList}
            contentContainerStyle={styles.commentsListContent}
            showsVerticalScrollIndicator={false}
          >
            {comments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                onPressReply={handlePressReply}
              />
            ))}
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
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textAlignVertical: "top",
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
  commentSubmitButtonText: {
    color: COLORS.panel,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  commentError: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: "700",
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
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  replyTargetBody: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
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
});
