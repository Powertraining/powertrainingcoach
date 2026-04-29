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
import Comment from "../../components/forumComponents/Comment.jsx";
import StandardText from "../../components/textComponents/StandardText.jsx";

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
                placeholderTextColor="#8A8A8A"
                selectionColor="#fff"
                style={styles.commentInput}
              />
              <TouchableOpacity
                style={styles.commentSubmitButton}
                onPress={onCreateComment}
                disabled={isSubmittingComment}
              >
                <StandardText fontSize={16} textColor="#000">
                  {isSubmittingComment ? "Posting..." : "Post Comment"}
                </StandardText>
              </TouchableOpacity>
              {commentError ? (
                <StandardText style={styles.commentError}>{commentError}</StandardText>
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
    backgroundColor: "#1C1C1C",
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
    borderColor: "#4A4A4A",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 16,
    textAlignVertical: "top",
  },
  commentSubmitButton: {
    alignSelf: "flex-start",
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 120,
    backgroundColor: "#C9B259",
    justifyContent: "center",
    alignItems: "center",
  },
  commentError: {
    color: "#FF7A7A",
    fontSize: 15,
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
