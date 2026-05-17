import { useState } from "react";
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
  activeReplyCommentId = null,
  replyValue = "",
  replyError = null,
  currentUserPhotoUrl = "",
  isSubmittingComment = false,
  isSubmittingReply = false,
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

  function openCommentEditor() {
    setIsCommentEditorOpen(true);
  }

  function closeCommentEditor() {
    Keyboard.dismiss();
    setIsCommentEditorOpen(false);
  }

  function handleCreateComment() {
    onCreateComment?.();
  }

  return (
    <QuestionnaireShell hideTabBar={false}>
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
                onPress={openCommentEditor}
                style={({ pressed }) => [
                  styles.commentComposer,
                  pressed ? styles.commentComposerPressed : null,
                ]}
              >
                <Image source={avatarSource} style={styles.commentAvatar} />
                <View style={styles.commentComposerBody}>
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
                </View>
              </Pressable>
              <View style={styles.commentsList}>
                {comments.map((comment) => (
                  <Comment
                    key={comment.id}
                    comment={comment}
                    activeReplyCommentId={activeReplyCommentId}
                    replyValue={replyValue}
                    replyError={replyError}
                    currentUserPhotoUrl={currentUserPhotoUrl}
                    isSubmittingReply={isSubmittingReply}
                    onPressReply={onPressReply}
                    onChangeReplyText={onChangeReplyText}
                    onCreateReply={onCreateReply}
                    onCancelReply={onCancelReply}
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
            <View style={[styles.commentEditorCard, { height: commentEditorHeight }]}>
              <View style={[styles.commentEditorComposer, { height: commentEditorHeight }]}>
                <Image
                  source={avatarSource}
                  style={[styles.commentAvatar, styles.commentEditorAvatar]}
                />
                <View style={styles.commentComposerBody}>
                  <TextInput
                    autoFocus
                    multiline
                    value={commentValue}
                    onChangeText={onChangeCommentText}
                    editable={!isSubmittingComment}
                    scrollEnabled
                    placeholder="Write a comment"
                    placeholderTextColor={COLORS.muted}
                    selectionColor="#fff"
                    style={[
                      styles.commentInput,
                      styles.commentEditorInput,
                      { height: commentEditorHeight },
                    ]}
                  />
                  {commentError ? (
                    <Text style={styles.commentError}>{commentError}</Text>
                  ) : null}
                </View>
              </View>
            </View>
            <View style={styles.commentEditorActions}>
              <TouchableOpacity
                style={styles.commentSubmitButton}
                onPress={handleCreateComment}
                disabled={isSubmittingComment}
              >
                <Text style={styles.commentSubmitButtonText}>
                  {isSubmittingComment ? "Posting..." : "Post Comment"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.commentCancelButton}
                onPress={closeCommentEditor}
                disabled={isSubmittingComment}
              >
                <Text style={styles.commentCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
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
  commentEditorComposer: {
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
