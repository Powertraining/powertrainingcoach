import { Image, ScrollView, StyleSheet, TouchableOpacity, View, TextInput } from "react-native";

import PostCard from "../../components/forumComponents/PostCard.jsx";
import QuestionnaireShell from "../questionnaire/QuestionnaireShell.jsx";

const COLORS = {
  gold: "#C9B259",
  panel: "#141414",
  panelBorder: "#1E1E1E",
  text: "#ffffff",
  muted: "#9ca3af",
};

export default function ForumView({
  posts = [],
  searchQuery = "",
  onChangeSearchQuery,
  onPressSearchFiltersButton,
  onTogglePostLike,
  onTogglePostSave,
  onToggleCoachResponse,
  onPressComments,
  onPressPost,
  onPressPostButton,
}) {
  return (
    <QuestionnaireShell hideTabBar={false}>
      <View style={styles.wrapper}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
          <View style={styles.searchBarWrapper}>
            <View style={styles.searchBar}>
              <Image
                source={require("../../assets/icons/search.png")}
                style={styles.searchIcon}
              />
              <TextInput
                selectionColor="#fff"
                placeholder="Search"
                placeholderTextColor={COLORS.muted}
                value={searchQuery}
                onChangeText={onChangeSearchQuery}
                style={styles.searchInput}
              />
              <TouchableOpacity
                onPress={onPressSearchFiltersButton}
                style={styles.filterButton}
              >
                <Image
                  source={require("../../assets/icons/filter.png")}
                  style={styles.filterIcon}
                />
              </TouchableOpacity>
            </View>
          </View>
           
          {posts.map((_, index) => (
            <PostCard
              key={posts[index].id}
              post={posts[index]}
              onTogglePostLike={onTogglePostLike}
              onTogglePostSave={onTogglePostSave}
              onToggleCoachResponse={onToggleCoachResponse}
              onPressComments={onPressComments}
              onPressPost={onPressPost}
            />
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.postButton} onPress={onPressPostButton}>
          <Image
            source={require("../../assets/icons/post.png")}
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

  searchBarWrapper: {
    backgroundColor: COLORS.panel,
    borderColor: COLORS.panelBorder,
    borderRadius: 120,
    borderWidth: 2,
    marginHorizontal: 16,
    height: 60,
    marginBottom: 24,
    marginTop: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.muted,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    height: "100%",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 18,
    padding: 0,
  },
  filterButton: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.26)",
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  filterIcon: {
    height: 18,
    tintColor: COLORS.text,
    width: 18,
  },
  postButton: {
    position: "absolute",
    right: 30,
    bottom: 100,
    width: 54,
    height: 54,
    borderRadius: 120,
    backgroundColor: COLORS.gold,
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  postButtonIcon: {
    width: 26,
    height: 26,
    tintColor: "#000",
  },
});
