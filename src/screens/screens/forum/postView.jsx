import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QuestionnaireShell from "../QuestionnaireShell.jsx";
import StandardText from "../../../components/textComponents/StandardText.jsx";
import VerifiedBadge from "../../../components/forumComponents/VerifiedBadge.jsx";
import Comment from "../../../components/forumComponents/Comment.jsx";
import GoldGradient from "../../../components/colorComponents/GoldGradient.jsx";

export default function PostView({
  post,
  comments = [],
  onBack,
  onTogglePostLike,
  onTogglePostSave,
  onToggleCoachResponse,
}) {
  if (!post) {
    return null;
  }

  const isPostLiked = Boolean(post?.isLiked);
  const isPostSaved = Boolean(post?.isSaved);

  return (
    <QuestionnaireShell>
      <View style={styles.wrapper}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <StandardText fontSize={18}>Back</StandardText>
        </TouchableOpacity>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.authorRow}>
              {post?.isCoachVerified ? <VerifiedBadge /> : null}
              <StandardText style={styles.authorName}>{post?.authorDisplayName}</StandardText>
            </View>
            <StandardText style={styles.topicText}>{post?.topic}</StandardText>
          </View>

          <StandardText style={styles.title}>{post?.title}</StandardText>
          <Text style={styles.body}>{post?.body}</Text>

          <View style={styles.menu}>
            <TouchableOpacity
              style={[styles.standardButton, isPostSaved ? styles.standardButtonActive : null]}
              onPress={() => onTogglePostSave?.(post.id)}
            >
              <Image
                source={require("../../../assets/icons/save.png")}
                style={[styles.buttonIcon, isPostSaved ? styles.buttonIconActive : null]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.countButton, isPostLiked ? styles.countButtonActive : null]}
              onPress={() => onTogglePostLike?.(post.id)}
            >
              <Image
                source={require("../../../assets/icons/like.png")}
                style={[styles.buttonIcon, isPostLiked ? styles.buttonIconActive : null]}
              />
              <StandardText fontSize={18} textColor={isPostLiked ? "#000" : "#fff"}>
                {post?.likesCount}
              </StandardText>
            </TouchableOpacity>
            {post?.coachResponseStatus === "responded" ? (
              <TouchableOpacity onPress={() => onToggleCoachResponse?.(post.id)}>
                <GoldGradient style={styles.coachResponseStatus}>
                  <StandardText style={styles.coachResponseText} textColor="#111111">
                    Coach Response
                  </StandardText>
                </GoldGradient>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.commentsSection}>
            <StandardText textColor="#C9B259" fontSize={22}>Comments</StandardText>
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <Comment key={comment.id} comment={comment} />
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
    paddingHorizontal: 24,
    paddingTop: 16,
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
    color: "#fff",
    fontSize: 18,
  },
  topicText: {
    color: "#C9B259",
    fontSize: 18,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    marginTop: 20,
  },
  body: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
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
  coachResponseStatus: {
    alignSelf: "flex-start",
    borderRadius: 120,
    paddingHorizontal: 10,
    height: 36,
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  coachResponseText: {
    fontSize: 19,
  },
  countButton: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 120,
    height: 36,
    width: 62,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  countButtonActive: {
    backgroundColor: "#fff",
  },
  standardButton: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 120,
    height: 36,
    width: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  standardButtonActive: {
    backgroundColor: "#fff",
  },
  buttonIcon: {
    width: 18,
    height: 18,
    tintColor: "#fff",
  },
  buttonIconActive: {
    tintColor: "#000",
  },
});
