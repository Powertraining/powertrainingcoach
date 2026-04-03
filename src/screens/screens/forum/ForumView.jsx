import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import PostCard from "../../../components/forumComponents/PostCard.jsx";
import QuestionnaireShell from "../QuestionnaireShell.jsx";

export default function ForumView({
  posts = [],
  onTogglePostLike,
  onTogglePostSave,
}) {
  return (
    <QuestionnaireShell>
      <View style={styles.wrapper}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
          {posts.map((_, index) => (
            <PostCard
              key={posts[index].id}
              post={posts[index]}
              onTogglePostLike={onTogglePostLike}
              onTogglePostSave={onTogglePostSave}
            />
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.postButton}>
          <Image
            source={require("../../../assets/icons/post.png")}
            style={styles.postButtonIcon}
          />
        </TouchableOpacity>
      </View>
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingVertical: 16,
    gap: 8,
    paddingBottom: 120,
  },
  postButton: {
    position: "absolute",
    right: 30,
    bottom: 100,
    width: 54,
    height: 54,
    borderRadius: 120,
    backgroundColor: "#C9B259",
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  postButtonIcon: {
    width: 26,
    height: 26,
    tintColor: "#000",
  },
});
