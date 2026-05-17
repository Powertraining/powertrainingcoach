import { useRef } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PostCard from "../../components/forumComponents/PostCard.jsx";
import LoadingView from "../LoadingView.jsx";
import QuestionnaireShell from "../questionnaire/QuestionnaireShell.jsx";
import SearchFiltersView from "./searchFiltersView.jsx";

const COLORS = {
  gold: "#C9B259",
  panel: "#141414",
  panelBorder: "#1E1E1E",
  text: "#ffffff",
  muted: "#9ca3af",
};

function hasActiveFilters(filters = {}) {
  const topics = Array.isArray(filters?.topics) ? filters.topics.filter(Boolean) : [];
  const legacyTopic = String(filters?.topic ?? "all").trim();

  return Boolean(
    String(filters?.searchQuery ?? "").trim() ||
      (legacyTopic && legacyTopic !== "all") ||
      topics.length > 0 ||
      String(filters?.exerciseId ?? "").trim() ||
      String(filters?.tag ?? "").trim() ||
      filters?.followedOnly ||
      (filters?.sortBy && filters.sortBy !== "recent")
  );
}

export default function ForumView({
  posts = [],
  isPostsLoading = false,
  postsError = null,
  title = "",
  emptyText = "No forum posts found.",
  showPostButton = true,
  searchQuery = "",
  filters = {},
  isSearchFiltersVisible = false,
  onChangeSearchQuery,
  onPressSearchFiltersButton,
  onCloseSearchFilters,
  onChangeFilterTopic,
  onChangeFilterSortBy,
  onResetFilters,
  onTogglePostLike,
  onTogglePostSave,
  onToggleCoachResponse,
  onPressComments,
  onPressPost,
  onPressTopic,
  onPressPostButton,
  onRetryPosts,
}) {
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef(null);
  const isResetFiltersVisible = hasActiveFilters(filters);
  const shouldShowResetFiltersButton =
    isResetFiltersVisible && !isSearchFiltersVisible;
  const hasFilterHeaderControl =
    shouldShowResetFiltersButton || isSearchFiltersVisible;
  const closeFiltersFromPosts = () => {
    if (isSearchFiltersVisible) {
      onCloseSearchFilters?.();
    }
  };

  return (
    <QuestionnaireShell hideTabBar={false}>
      <View style={styles.wrapper}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.container,
            { paddingTop: Math.max(insets.top + 8, 16) },
          ]}
        >
          {title ? (
            <Text style={styles.title}>{title}</Text>
          ) : null}

          <View
            style={[
              styles.searchBarWrapper,
              hasFilterHeaderControl ? styles.searchBarWrapperWithReset : null,
            ]}
          >
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

          {shouldShowResetFiltersButton ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onResetFilters}
              style={styles.resetFiltersButton}
            >
              <Text style={styles.resetFiltersButtonText}>Reset filters</Text>
            </TouchableOpacity>
          ) : null}

          <SearchFiltersView
            visible={isSearchFiltersVisible}
            filters={filters}
            onClose={onCloseSearchFilters}
            onChangeTopic={onChangeFilterTopic}
            onChangeSortBy={onChangeFilterSortBy}
            onReset={onResetFilters}
          />
           
          <View
            style={styles.postsSection}
            onTouchStart={closeFiltersFromPosts}
          >
            {isPostsLoading ? (
              <View style={styles.postsState}>
                <LoadingView />
              </View>
            ) : postsError ? (
              <View style={styles.postsState}>
                <Text style={styles.postsErrorText}>
                  {postsError.message || "Could not load the forum feed."}
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={onRetryPosts}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : posts.length === 0 ? (
              <View style={styles.postsState}>
                <Text style={styles.emptyText}>{emptyText}</Text>
              </View>
            ) : (
              posts.map((_, index) => (
                <PostCard
                  key={posts[index].id}
                  post={posts[index]}
                  onTogglePostLike={onTogglePostLike}
                  onTogglePostSave={onTogglePostSave}
                  onToggleCoachResponse={onToggleCoachResponse}
                  onPressComments={onPressComments}
                  onPressPost={onPressPost}
                  onPressTopic={onPressTopic}
                />
              ))
            )}
          </View>
        </ScrollView>
        {showPostButton ? (
          <TouchableOpacity style={styles.postButton} onPress={onPressPostButton}>
            <Image
              source={require("../../assets/icons/post.png")}
              style={styles.postButtonIcon}
            />
          </TouchableOpacity>
        ) : null}
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
    gap: 8,
    paddingBottom: 120,
  },
  postsSection: {
    gap: 8,
  },
  postsState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
    paddingHorizontal: 24,
  },
  postsErrorText: {
    color: COLORS.text,
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

  searchBarWrapper: {
    backgroundColor: "rgba(126, 126, 126, 0.5)",
    borderRadius: 120,
    marginHorizontal: 16,
    height: 60,
    marginBottom: 24,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
  },
  searchBarWrapperWithReset: {
    marginBottom: 12,
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
    tintColor: COLORS.text,
  },
  searchIconButton: {
    alignItems: "center",
    height: 34,
    justifyContent: "center",
    width: 34,
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
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  filterIcon: {
    height: 30,
    tintColor: COLORS.text,
    width: 30,
  },
  resetFiltersButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.text,
    borderRadius: 999,
    justifyContent: "center",
    marginBottom: 12,
    marginLeft: 20,
    minHeight: 34,
    paddingHorizontal: 14,
  },
  resetFiltersButtonText: {
    color: COLORS.panel,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
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
