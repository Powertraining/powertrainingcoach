import { StyleSheet, TouchableWithoutFeedback, View, Text } from "react-native";
import Comment from "../../../components/forumComponents/Comment.jsx";
import StandardText from "../../../components/textComponents/StandardText.jsx";

export default function CoachResponseView({ onClose, comments = [] }) {
  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <View style={styles.backdrop} />
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.content}>
            <View style={styles.box}>
              <StandardText textColor="#C9B259" fontSize={24}>Coach Response</StandardText>
              <Text style={styles.description}>
                Coach Response shows that a verified coach has contributed to the thread, so you can weigh the advice with more confidence.
              </Text>
            </View>
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <Comment key={comment.id} comment={comment} />
              ))}
            </View>
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
    backgroundColor: "#121212",
    borderRadius: 45,
    padding: 40,
  },
  box: {
    alignItems: "center",
  },
  description: {
    fontSize: 17,
    color: "#C9B259",
    marginTop: 10,
    textAlign: "center",
  },
  commentsList: {
    alignSelf: "stretch",
    marginTop: 20,
    marginHorizontal: -40,
  },
});
