import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Comment from "../../../components/forumComponents/Comment.jsx";

export default function CommentsView({ onClose, comments = [] }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.content}>
          <ScrollView
            style={styles.commentsList}
            contentContainerStyle={styles.commentsListContent}
            showsVerticalScrollIndicator={false}
          >
            {comments.map((comment) => (
              <Comment key={comment.id} comment={comment} />
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
  commentsList: {
    flex: 1,
    marginTop: 20,
    marginHorizontal: -40,
  },
  commentsListContent: {
    paddingBottom: 12,
  },
});
