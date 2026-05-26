import { useEffect, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import QuestionnaireShell from "../questionnaire/QuestionnaireShell.jsx";
import VerifiedBadge from "../../components/forumComponents/VerifiedBadge.jsx";
import Comment from "../../components/forumComponents/Comment.jsx";
import GoldGradient from "../../components/colorComponents/GoldGradient.jsx";
import LockIcon from "../../components/LockIcon.jsx";

const COLORS = {
  gold: "#C9B259",
  panel: "#141414",
  panelBorder: "#1E1E1E",
  text: "#ffffff",
  muted: "#9ca3af",
  error: "#fca5a5",
};

export default function PostView({
  post,
  comments = [],
  commentValue = "",
  commentError = null,
  replyValue = "",
  replyError = null,
  currentUserPhotoUrl = "",
  isSubmittingComment = false,
  isSubmittingReply = false,
  commentsLocked = false,
  hideTabBar = false,
  onBack,
  onChangeCommentText,
  onCreateComment,
  onPressReply,
  onChangeReplyText,
  onCreateReply,
  onCancelReply,
  onTogglePostLike,
  onTogglePostSave,
  onToggleCoachResponse,
}) {
  const { height: windowHeight } = useWindowDimensions();
  const [isCommentEditorOpen, setIsCommentEditorOpen] = useState(false);
  const [replyTargetComment, setReplyTargetComment] = useState(null);
  const wasSubmittingCommentRef = useRef(false);
  const wasSubmittingReplyRef = useRef(false);
  const commentEditorHeight = windowHeight * 0.35;

  if (!post) {
    return null;
  }

  const isPostLiked = Boolean(post?.isLiked);
  const isPostSaved = Boolean(post?.isSaved);
  const postAvatarSource =
    post?.authorAvatarUrl ?
      { uri: post.authorAvatarUrl } :
      require("../../assets/icons/user.png");
  const avatarSource =
    currentUserPhotoUrl ?
      { uri: currentUserPhotoUrl } :
      require("../../assets/icons/user.png");
  const isReplyEditor = Boolean(replyTargetComment);
  const editorValue = isReplyEditor ? replyValue : commentValue;
  const editorError = isReplyEditor ? replyError : commentError;
  const isSubmittingEditor = isReplyEditor ? isSubmittingReply : isSubmittingComment;
  const replyTargetAvatarSource =
    replyTargetComment?.authorAvatarUrl ?
      { uri: replyTargetComment.authorAvatarUrl } :
      require("../../assets/icons/user.png");

  useEffect(() => {
    if (
      wasSubmittingCommentRef.current &&
      !isSubmittingComment &&
      !replyTargetComment &&
      !commentError
    ) {
      Keyboard.dismiss();
      setIsCommentEditorOpen(false);
    }

    wasSubmittingCommentRef.current = isSubmittingComment;
  }, [commentError, isSubmittingComment, replyTargetComment]);

  useEffect(() => {
    if (
      wasSubmittingReplyRef.current &&
      !isSubmittingReply &&
      replyTargetComment &&
      !replyError
    ) {
      Keyboard.dismiss();
      setReplyTargetComment(null);
      setIsCommentEditorOpen(false);
    }

    wasSubmittingReplyRef.current = isSubmittingReply;
  }, [isSubmittingReply, replyError, replyTargetComment]);

  function openCommentEditor() {
    if (commentsLocked) {
      return;
    }

    if (replyTargetComment) {
      onCancelReply?.();
      setReplyTargetComment(null);
    }

    setIsCommentEditorOpen(true);
  }

  function closeCommentEditor() {
    Keyboard.dismiss();
    if (replyTargetComment) {
      onCancelReply?.();
      setReplyTargetComment(null);
    }

    setIsCommentEditorOpen(false);
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
    setIsCommentEditorOpen(true);
  }

  function handleChangeEditorText(value) {
    if (commentsLocked) {
      return;
    }

    if (isReplyEditor) {
      onChangeReplyText?.(value);
      return;
    }

    onChangeCommentText?.(value);
  }

  function handleSubmitEditor() {
    if (commentsLocked) {
      return;
    }

    if (isReplyEditor) {
      onCreateReply?.();
      return;
    }

    onCreateComment?.();
  }

  return (
    <QuestionnaireShell hideTabBar={hideTabBar}>
      <View style={styles.wrapper}>
        <View style={[styles.screenContent, isCommentEditorOpen ? styles.blurredContent : null]}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Image source={postAvatarSource} style={styles.postAvatar} />
              <View style={styles.authorDetails}>
                <View style={styles.authorRow}>
                  {post?.isCoachVerified ? <VerifiedBadge /> : null}
                  <Text numberOfLines={1} style={styles.authorName}>
                    {post?.authorDisplayName}
                  </Text>
                </View>
                <Text numberOfLines={1} style={styles.topicText}>
                  {post?.topic}
                </Text>
              </View>
            </View>

            <Text style={styles.title}>{post?.title}</Text>
            <Text style={styles.body}>{post?.body}</Text>

            <View style={styles.menu}>
              <TouchableOpacity
                style={[styles.standardButton, isPostSaved ? styles.standardButtonActive : null]}
                onPress={() => onTogglePostSave?.(post.id)}
              >
                <Image
                  source={require("../../assets/icons/save.png")}
                  style={[styles.buttonIcon, isPostSaved ? styles.buttonIconActive : null]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.countButton, isPostLiked ? styles.countButtonActive : null]}
                onPress={() => onTogglePostLike?.(post.id)}
              >
                <Image
                  source={require("../../assets/icons/like.png")}
                  style={[styles.buttonIcon, isPostLiked ? styles.buttonIconActive : null]}
                />
                <Text style={[styles.countText, isPostLiked ? styles.countTextActive : null]}>
                  {post?.likesCount}
                </Text>
              </TouchableOpacity>
              <View style={styles.commentCount}>
                <Image
                  source={require("../../assets/icons/conversation.png")}
                  style={styles.buttonIcon}
                />
                <Text style={styles.countText}>{post?.commentsCount}</Text>
              </View>
              {post?.coachResponseStatus === "responded" ? (
                <TouchableOpacity onPress={() => onToggleCoachResponse?.(post.id)}>
                  <GoldGradient style={styles.coachResponseStatus}>
                    <Text style={styles.coachResponseText}>
                      Coach Response
                    </Text>
                  </GoldGradient>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.commentsSection}>
              <Pressable
                disabled={commentsLocked}
                onPress={openCommentEditor}
                style={({ pressed }) => [
                  styles.commentComposer,
                  commentsLocked ? styles.commentComposerLocked : null,
                  pressed ? styles.commentComposerPressed : null,
                ]}
              >
                <Image
                  source={avatarSource}
                  style={[
                    styles.commentAvatar,
                    commentsLocked ? styles.lockedCommentPreviewContent : null,
                  ]}
                />
                <View
                  style={[
                    styles.commentComposerBody,
                    commentsLocked ? styles.lockedCommentPreviewContent : null,
                  ]}
                >
                  {commentsLocked ? (
                    <>
                      <View style={styles.lockedCommentLineLong} />
                      <View style={styles.lockedCommentLine} />
                    </>
                  ) : (
                    <>
                      <Text
                        numberOfLines={3}
                        style={[
                          styles.commentPreviewText,
                          !commentValue ? styles.commentPreviewPlaceholder : null,
                        ]}
                      >
                        {commentValue || "Write a comment"}
                      </Text>
                      <View style={styles.commentPromptUnderline} />
                    </>
                  )}
                </View>
                {commentsLocked ? (
                  <View pointerEvents="none" style={styles.commentComposerLockOverlay}>
                    <LockIcon size={16} style={styles.commentComposerLockInlineIcon} />
                    <Text style={styles.commentComposerLockText}>
                      Members only, so coaches can ensure safety and quality.
                    </Text>
                  </View>
                ) : null}
              </Pressable>
              <View style={styles.commentsList}>
                {comments.map((comment) => (
                  <Comment
                    key={comment.id}
                    comment={comment}
                    onPressReply={commentsLocked ? undefined : handlePressReply}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        </View>

        {isCommentEditorOpen ? (
          <Pressable
            onPress={closeCommentEditor}
            style={styles.commentEditorDimLayer}
          />
        ) : null}

        {isCommentEditorOpen ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            pointerEvents="box-none"
            style={[
              styles.commentEditorLayer,
              {
                height: windowHeight / 2,
                paddingTop: Math.max((windowHeight / 2 - commentEditorHeight) / 2, 0),
              },
            ]}
          >
            {commentsLocked ? (
              <View style={[styles.commentEditorCard, styles.lockedCommentEditorCard, { height: commentEditorHeight }]}>
                <View style={styles.lockedCommentEditorContent}>
                  <View style={styles.lockedCommentEditorPreview}>
                    <Image source={avatarSource} style={styles.commentAvatar} />
                    <View style={styles.lockedCommentEditorPreviewBody}>
                      <View style={styles.lockedCommentLineLong} />
                      <View style={styles.lockedCommentLine} />
                      <View style={styles.lockedCommentLineShort} />
                    </View>
                  </View>
                </View>
                <View style={styles.lockedCommentEditorOverlay}>
                  <LockIcon size={24} style={styles.lockedCommentMessageIcon} />
                  <Text style={styles.lockedCommentMessageTitle}>
                    Commenting is locked
                  </Text>
                  <Text style={styles.lockedCommentMessageText}>
                    Commenting is limited to members so coaches can maintain safety and quality feedback.
                  </Text>
                  <TouchableOpacity
                    style={styles.lockedCommentBackButton}
                    onPress={closeCommentEditor}
                  >
                    <Text style={styles.lockedCommentBackButtonText}>
                      Go Back
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
            <View style={[styles.commentEditorCard, { height: commentEditorHeight }]}>
              {isReplyEditor ? (
                <View style={styles.replyTargetPreview}>
                  <Image
                    source={replyTargetAvatarSource}
                    style={styles.replyTargetAvatar}
                  />
                  <View style={styles.replyTargetTextContent}>
                    <View style={styles.replyTargetNameRow}>
                      {replyTargetComment?.isCoachVerified ? <VerifiedBadge /> : null}
                      <Text numberOfLines={1} style={styles.replyTargetName}>
                        {replyTargetComment?.authorDisplayName}
                      </Text>
                    </View>
                    <Text numberOfLines={3} style={styles.replyTargetBody}>
                      {replyTargetComment?.body}
                    </Text>
                  </View>
                </View>
              ) : null}
              <View style={styles.commentEditorComposer}>
                <Image
                  source={avatarSource}
                  style={[styles.commentAvatar, styles.commentEditorAvatar]}
                />
                <View style={styles.commentComposerBody}>
                  <TextInput
                    autoFocus
                    multiline
                    value={editorValue}
                    onChangeText={handleChangeEditorText}
                    editable={!isSubmittingEditor}
                    scrollEnabled
                    placeholder={isReplyEditor ? "Write a reply" : "Write a comment"}
                    placeholderTextColor={COLORS.muted}
                    selectionColor="#fff"
                    style={[
                      styles.commentInput,
                      styles.commentEditorInput,
                      { flex: 1 },
                    ]}
                  />
                  {editorError ? (
                    <Text style={styles.commentError}>{editorError}</Text>
                  ) : null}
                </View>
              </View>
            </View>
            )}
            {!commentsLocked ? (
              <View style={styles.commentEditorActions}>
              <TouchableOpacity
                style={styles.commentSubmitButton}
                onPress={handleSubmitEditor}
                disabled={isSubmittingEditor}
              >
                <Text style={styles.commentSubmitButtonText}>
                  {isSubmittingEditor ?
                    "Posting..." :
                    isReplyEditor ? "Post Reply" : "Post Comment"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.commentCancelButton}
                onPress={closeCommentEditor}
                disabled={isSubmittingEditor}
              >
                <Text style={styles.commentCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            ) : null}
          </KeyboardAvoidingView>
        ) : null}
      </View>
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
  },
  blurredContent: {
    opacity: 0.42,
    filter: [{ blur: 4 }],
  },
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 8,
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  postAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#2A2A2A",
  },
  authorDetails: {
    flex: 1,
    gap: 5,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  authorName: {
    color: COLORS.text,
    flexShrink: 1,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
  },
  topicText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
    textTransform: "uppercase",
  },
  title: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 32,
    marginTop: 24,
  },
  body: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 26,
    marginTop: 24,
  },
  menu: {
    marginTop: 30,
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  commentsSection: {
    marginTop: 24,
    gap: 12,
  },
  commentsList: {
    marginHorizontal: -24,
  },
  commentComposer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: -24,
    minHeight: 104,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  commentComposerLocked: {
    position: "relative",
  },
  lockedCommentPreviewContent: {
    opacity: 0.42,
    filter: [{ blur: 3 }],
  },
  commentComposerPressed: {
    opacity: 0.72,
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
  commentPreviewText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
  },
  commentPreviewPlaceholder: {
    color: COLORS.text,
  },
  commentPromptUnderline: {
    height: 1,
    alignSelf: "stretch",
    backgroundColor: COLORS.text,
    opacity: 0.9,
  },
  lockedCommentLineLong: {
    backgroundColor: COLORS.text,
    borderRadius: 4,
    height: 12,
    opacity: 0.72,
    width: "72%",
  },
  lockedCommentLine: {
    backgroundColor: COLORS.muted,
    borderRadius: 4,
    height: 12,
    opacity: 0.62,
    width: "54%",
  },
  lockedCommentLineShort: {
    backgroundColor: COLORS.muted,
    borderRadius: 4,
    height: 12,
    opacity: 0.54,
    width: "36%",
  },
  commentComposerLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(12, 12, 12, 0.5)",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  commentComposerLockInlineIcon: {
    flexShrink: 0,
  },
  commentComposerLockText: {
    color: COLORS.gold,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
  },
  commentInput: {
    minHeight: 90,
    paddingHorizontal: 0,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textAlignVertical: "top",
  },
  commentEditorInput: {
    paddingTop: 28,
  },
  commentEditorDimLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.48)",
    zIndex: 19,
  },
  commentEditorLayer: {
    alignItems: "center",
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
  },
  commentEditorCard: {
    alignSelf: "stretch",
    backgroundColor: "#000000",
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderTopWidth: 1,
    overflow: "hidden",
  },
  lockedCommentEditorCard: {
    position: "relative",
  },
  lockedCommentEditorContent: {
    flex: 1,
    opacity: 0.42,
    filter: [{ blur: 3 }],
  },
  lockedCommentEditorPreview: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  lockedCommentEditorPreviewBody: {
    flex: 1,
    gap: 13,
    paddingTop: 10,
  },
  lockedCommentEditorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(12, 12, 12, 0.58)",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  lockedCommentMessageIcon: {
    marginBottom: 10,
  },
  lockedCommentMessageTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
    textAlign: "center",
  },
  lockedCommentMessageText: {
    color: COLORS.gold,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 320,
    textAlign: "center",
  },
  lockedCommentBackButton: {
    alignItems: "center",
    backgroundColor: COLORS.text,
    borderRadius: 999,
    justifyContent: "center",
    marginTop: 18,
    minHeight: 34,
    paddingHorizontal: 18,
  },
  lockedCommentBackButtonText: {
    color: COLORS.panel,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  commentEditorComposer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 24,
  },
  commentEditorAvatar: {
    marginTop: 20,
  },
  commentEditorActions: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-start",
    marginTop: 10,
    paddingHorizontal: 20,
  },
  commentSubmitButton: {
    alignSelf: "flex-start",
    minHeight: 36,
    paddingHorizontal: 18,
    borderRadius: 999,
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
  commentCancelButton: {
    alignItems: "center",
    backgroundColor: COLORS.panel,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 18,
  },
  commentCancelButtonText: {
    color: COLORS.text,
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
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
  replyTargetNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  coachResponseStatus: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 36,
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  coachResponseText: {
    color: "#111111",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  countButton: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    minWidth: 66,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  countButtonActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  commentCount: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
    height: 36,
    justifyContent: "center",
  },
  standardButton: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    width: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  standardButtonActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  buttonIcon: {
    width: 18,
    height: 18,
    tintColor: COLORS.text,
  },
  buttonIconActive: {
    tintColor: "#000",
  },
  countText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
  },
  countTextActive: {
    color: "#111111",
  },
});
