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
  activeReplyCommentId = null,
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
  const avatarSource =
    currentUserPhotoUrl ?
      { uri: currentUserPhotoUrl } :
      require("../../assets/icons/user.png");

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.content}>
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
          <ScrollView
            style={styles.commentsList}
            contentContainerStyle={styles.commentsListContent}
            showsVerticalScrollIndicator={false}
          >
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
  commentsList: {
    flex: 1,
    marginTop: 20,
    marginHorizontal: -40,
  },
  commentsListContent: {
    paddingBottom: 12,
  },
});
