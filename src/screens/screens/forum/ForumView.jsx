import { Image, ScrollView, StyleSheet, TouchableOpacity, View, TextInput } from "react-native";
import PostCard from "../../../components/forumComponents/PostCard.jsx";
import StandardText from "../../../components/textComponents/StandardText.jsx";
import QuestionnaireShell from "../QuestionnaireShell.jsx";

export default function ForumView({
  posts = [],
  onTogglePostLike,
  onTogglePostSave,
  onToggleCoachResponse,
}) {
  return (
    <QuestionnaireShell>
      <View style={styles.wrapper}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
          <View style={styles.searchBarWrapper}>
            <View style={styles.searchBar}>
              <Image
                source={require("../../../assets/icons/search.png")}
                style={styles.searchIcon}
              />
              <TextInput selectionColor="#fff"  style={styles.searchInput} />
              <TouchableOpacity>
                <Image source={require("../../../assets/icons/filter.png")} style={{width: 30, height: 30}} />
              </TouchableOpacity>
              
            </View>
          </View>
           
          {posts.length === 0 ? (
            <View style={styles.emptyState}>
              <StandardText textColor="#fff" fontSize={20}>
                No forum posts yet.
              </StandardText>
              <StandardText textColor="rgba(255, 255, 255, 0.72)" fontSize={16}>
                Once posts are stored in Firestore, they will appear here.
              </StandardText>
            </View>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onTogglePostLike={onTogglePostLike}
                onTogglePostSave={onTogglePostSave}
                onToggleCoachResponse={onToggleCoachResponse}
              />
            ))
          )}
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
  // Layout
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
  emptyState: {
    marginHorizontal: 24,
    marginTop: 12,
    gap: 8,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },

  // Search
  searchBarWrapper: {
    borderRadius: 120,
    marginHorizontal: 16,
    height: 60,
    marginBottom: 24,
    marginTop: 8,
    backgroundColor: "rgba(126, 126, 126, 0.5)",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    width: 24,
    height: 24,
    tintColor: "#fff",
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    height: "100%",
    fontSize: 18,
  },

  // Floating action
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
