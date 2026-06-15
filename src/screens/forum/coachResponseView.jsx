import {
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import Comment from "../../components/forumComponents/Comment.jsx";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
const COLORS = {
  gold: "#C9B259",
  panel: "#141414",
  panelBorder: "#1E1E1E",
  text: "#ffffff",
  muted: "#9ca3af",
};

export default function CoachResponseView({ onClose, comments = [] }) {
  const { height } = useWindowDimensions();
  const contentMaxHeight = Math.round(height * 0.82);
  const commentsMaxHeight = Math.max(160, Math.round(height * 0.42));

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <View style={styles.backdrop} />
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={[styles.content, { maxHeight: contentMaxHeight }]}>
            <View style={styles.box}>
              <IBMPlexText style={styles.title}>Coach Response</IBMPlexText>
              <IBMPlexText style={styles.description}>
                Coach Response shows that a verified coach has contributed to the thread, so you can weigh the advice with more confidence.
              </IBMPlexText>
            </View>
            <ScrollView
              style={[styles.commentsList, { maxHeight: commentsMaxHeight }]}
              contentContainerStyle={styles.commentsListContent}
              showsVerticalScrollIndicator={false}
            >
              {comments.map((comment) => (
                <Comment key={comment.id} comment={comment} />
              ))}
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    opacity: 0.75,
  },
  content: {
    width: "85%",
    backgroundColor: COLORS.panel,
    borderColor: COLORS.panelBorder,
    borderWidth: 2,
    borderRadius: 45,
    padding: 40,
  },
  box: {
    alignItems: "center",
  },
  title: {
    color: COLORS.gold,
    fontSize: 20, fontWeight: "900",
    lineHeight: 25,
  },
  description: {
    fontSize: 14, fontWeight: "600",
    lineHeight: 20,
    color: COLORS.muted,
    marginTop: 10,
    textAlign: "center",
  },
  commentsList: {
    alignSelf: "stretch",
    marginTop: 20,
    marginHorizontal: -40,
  },
  commentsListContent: {
    paddingBottom: 8,
  },
});
