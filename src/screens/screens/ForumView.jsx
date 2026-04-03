import { ScrollView, StyleSheet } from "react-native";
import PostCard from "../../components/forumComponents/PostCard.jsx";
import QuestionnaireShell from "./QuestionnaireShell.jsx";

export default function ForumView({
  posts = [],
  onTogglePostLike,
  onTogglePostSave,
}) {
  return (
    <QuestionnaireShell>
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
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 8,
    paddingBottom: 120,
  },
});
