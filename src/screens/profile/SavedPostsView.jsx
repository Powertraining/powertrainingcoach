import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PostCard from "../../components/forumComponents/PostCard.jsx";
import LoadingView from "../LoadingView.jsx";
import QuestionnaireShell from "../questionnaire/QuestionnaireShell.jsx";

const COLORS = {
  panel: "#141414",
  text: "#ffffff",
  muted: "#9ca3af",
};

export default function SavedPostsView({
  posts = [],
  isLoading = false,
  error = null,
  title = "Saved Posts",
  searchPlaceholder = "Search saved posts",
  emptyText = "Saved posts will show up here.",
  errorText = "Could not load saved posts.",
  searchQuery = "",
  onBack,
  onChangeSearchQuery,
  onRetry,
  onTogglePostLike,
  onTogglePostSave,
  onToggleCoachResponse,
  onPressPost,
  onPressTopic,
}) {
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef(null);

  return (
    <QuestionnaireShell hideTabBar={false}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top + 12, 20) },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.searchBar}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => searchInputRef.current?.focus()}
            style={styles.searchIconButton}
          >
            <Image
              source={require("../../assets/icons/search.png")}
              style={styles.searchIcon}
            />
          </TouchableOpacity>
          <TextInput
            ref={searchInputRef}
            selectionColor="#fff"
            placeholder={searchPlaceholder}
            placeholderTextColor={COLORS.muted}
            value={searchQuery}
            onChangeText={onChangeSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {isLoading ? (
          <View style={styles.state}>
            <LoadingView />
          </View>
        ) : error ? (
          <View style={styles.state}>
            <Text style={styles.errorText}>
              {error.message || errorText}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.state}>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        ) : (
          <View style={styles.postsSection}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onTogglePostLike={onTogglePostLike}
                onTogglePostSave={onTogglePostSave}
                onToggleCoachResponse={onToggleCoachResponse}
                onPressPost={onPressPost}
                onPressTopic={onPressTopic}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    position: "absolute",
    top: 0,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 8,
    zIndex: 20,
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32,
  },
  searchBar: {
    alignItems: "center",
    backgroundColor: "rgba(126, 126, 126, 0.5)",
    borderRadius: 120,
    flexDirection: "row",
    gap: 12,
    height: 60,
    marginBottom: 20,
    marginHorizontal: 16,
    paddingHorizontal: 16,
  },
  searchIconButton: {
    alignItems: "center",
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  searchIcon: {
    height: 24,
    tintColor: COLORS.text,
    width: 24,
  },
  searchInput: {
    color: COLORS.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    height: "100%",
    lineHeight: 18,
    padding: 0,
  },
  postsSection: {
    gap: 8,
  },
  state: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
    paddingHorizontal: 24,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 14,
    textAlign: "center",
  },
  retryButton: {
    alignItems: "center",
    backgroundColor: COLORS.text,
    borderRadius: 999,
    justifyContent: "center",
    minWidth: 104,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryButtonText: {
    color: COLORS.panel,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
});
