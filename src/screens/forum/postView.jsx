import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
  if (!post) {
    return null;
  }

  const isPostLiked = Boolean(post?.isLiked);
  const isPostSaved = Boolean(post?.isSaved);
  const avatarSource =
    currentUserPhotoUrl ?
      { uri: currentUserPhotoUrl } :
      require("../../assets/icons/user.png");

  return (
    <QuestionnaireShell hideTabBar={false}>
      <View style={styles.wrapper}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
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
            <Text style={styles.commentsTitle}>Comments</Text>
            <View style={styles.commentComposer}>
              <Image source={avatarSource} style={styles.commentAvatar} />
              <View style={styles.commentComposerBody}>
                <TextInput
                  multiline
                  value={commentValue}
                  onChangeText={onChangeCommentText}
                  editable={!isSubmittingComment}
                  placeholder="Write a comment"
                  placeholderTextColor={COLORS.muted}
                  selectionColor="#fff"
                  style={styles.commentInput}
                />
                <TouchableOpacity
                  style={styles.commentSubmitButton}
                  onPress={onCreateComment}
                  disabled={isSubmittingComment}
                >
                  <Text style={styles.commentSubmitButtonText}>
                    {isSubmittingComment ? "Posting..." : "Post Comment"}
                  </Text>
                </TouchableOpacity>
                {commentError ? (
                  <Text style={styles.commentError}>{commentError}</Text>
                ) : null}
              </View>
            </View>
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
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingVertical: 4,
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
  },
  header: {
    gap: 8,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  authorName: {
    color: COLORS.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
  },
  topicText: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
    textTransform: "uppercase",
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
    marginTop: 20,
  },
  body: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 23,
    marginTop: 20,
  },
  menu: {
    marginTop: 25,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  commentsSection: {
    marginTop: 32,
    gap: 12,
  },
  commentsList: {
    marginHorizontal: -24,
  },
  commentsTitle: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
  },
  commentComposer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 4,
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
