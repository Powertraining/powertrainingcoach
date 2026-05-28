import {
  useEffect,
  useRef,
} from "react";
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PostCard from "../../components/forumComponents/PostCard.jsx";
import LockIcon from "../../components/LockIcon.jsx";
import QuestionnaireShell from "../questionnaire/QuestionnaireShell.jsx";
import SearchFiltersView from "./searchFiltersView.jsx";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
const COLORS = {
  gold: "#C9B259",
  panel: "#141414",
  panelBorder: "#1E1E1E",
  text: "#ffffff",
  muted: "#9ca3af",
};
const SKELETON_POSTS = [0, 1, 2, 3];

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

function SkeletonBlock({ style }) {
  return <View style={[styles.skeletonBlock, style]} />;
}

function ForumPostSkeleton({ index = 0 }) {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonCardContent}>
        <View style={styles.skeletonHeader}>
          <SkeletonBlock style={styles.skeletonAvatar} />
          <View style={styles.skeletonHeaderCopy}>
            <SkeletonBlock
              style={[
                styles.skeletonAuthorLine,
                index % 2 ? styles.skeletonAuthorLineShort : null,
              ]}
            />
            <SkeletonBlock style={styles.skeletonTopicLine} />
          </View>
        </View>
        <SkeletonBlock
          style={[
            styles.skeletonTitleLine,
            index % 3 === 1 ? styles.skeletonTitleLineShort : null,
          ]}
        />
        <View style={styles.skeletonBody}>
          <SkeletonBlock style={styles.skeletonBodyLineLong} />
          <SkeletonBlock style={styles.skeletonBodyLine} />
          <SkeletonBlock
            style={[
              styles.skeletonBodyLineMedium,
              index % 2 ? styles.skeletonBodyLineShort : null,
            ]}
          />
        </View>
        <View style={styles.skeletonActions}>
          <SkeletonBlock style={styles.skeletonIconButton} />
          <SkeletonBlock style={styles.skeletonCountButton} />
          <SkeletonBlock style={styles.skeletonCountButton} />
        </View>
      </View>
    </View>
  );
}

function AnimatedFilterIcon({ active = false }) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: active ? 1 : 0,
      duration: 190,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [active, progress]);

  const topLineStyle = {
    width: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [22, 14],
    }),
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 8],
        }),
      },
    ],
  };
  const bottomLineStyle = {
    width: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [14, 22],
    }),
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.animatedFilterIcon}>
      <Animated.View style={[styles.filterIconLine, topLineStyle]} />
      <Animated.View style={[styles.filterIconLine, bottomLineStyle]} />
    </View>
  );
}

export default function ForumView({
  posts = [],
  isPostsLoading = false,
  postsError = null,
  title = "",
  emptyText = "No forum posts found.",
  showPostButton = true,
  isPostButtonLocked = false,
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
            <IBMPlexText style={styles.title}>{title}</IBMPlexText>
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
                <AnimatedFilterIcon active={isSearchFiltersVisible} />
              </TouchableOpacity>
            </View>
          </View>

          {shouldShowResetFiltersButton ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onResetFilters}
              style={styles.resetFiltersButton}
            >
              <IBMPlexText style={styles.resetFiltersButtonText}>Reset filters</IBMPlexText>
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
              <View style={styles.skeletonList}>
                {SKELETON_POSTS.map((item) => (
                  <ForumPostSkeleton key={`forum-post-skeleton-${item}`} index={item} />
                ))}
              </View>
            ) : postsError ? (
              <View style={styles.postsState}>
                <IBMPlexText style={styles.postsErrorText}>
                  {postsError.message || "Could not load the forum feed."}
                </IBMPlexText>
                <TouchableOpacity style={styles.retryButton} onPress={onRetryPosts}>
                  <IBMPlexText style={styles.retryButtonText}>Try Again</IBMPlexText>
                </TouchableOpacity>
              </View>
            ) : posts.length === 0 ? (
              <View style={styles.postsState}>
                <IBMPlexText style={styles.emptyText}>{emptyText}</IBMPlexText>
              </View>
            ) : (
              posts.map((_, index) => (
                <PostCard
                  key={posts[index].id}
                  post={posts[index]}
                  onTogglePostLike={onTogglePostLike}
                  onTogglePostSave={onTogglePostSave}
                  onToggleCoachResponse={onToggleCoachResponse}
                  onPressPost={onPressPost}
                  onPressTopic={onPressTopic}
                />
              ))
            )}
          </View>
        </ScrollView>
        {showPostButton ? (
          <TouchableOpacity
            style={[
              styles.postButton,
              isPostButtonLocked ? styles.postButtonLocked : null,
            ]}
            onPress={onPressPostButton}
          >
            <Image
              source={require("../../assets/icons/post.png")}
              style={[
                styles.postButtonIcon,
                isPostButtonLocked ? styles.postButtonIconLocked : null,
              ]}
            />
            {isPostButtonLocked ? (
              <View pointerEvents="none" style={styles.postButtonLockOverlay}>
                <LockIcon size={22} />
              </View>
            ) : null}
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
  skeletonList: {
    gap: 8,
  },
  skeletonCard: {
    borderBottomColor: COLORS.panelBorder,
    borderBottomWidth: 1,
    minHeight: 220,
    paddingBottom: 8,
    paddingTop: 12,
  },
  skeletonCardContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  skeletonBlock: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
  },
  skeletonHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingBottom: 16,
  },
  skeletonAvatar: {
    backgroundColor: "rgba(255,255,255,0.18)",
    height: 42,
    width: 42,
  },
  skeletonHeaderCopy: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  skeletonAuthorLine: {
    height: 14,
    width: "44%",
  },
  skeletonAuthorLineShort: {
    width: "32%",
  },
  skeletonTopicLine: {
    backgroundColor: "rgba(201,178,89,0.34)",
    height: 11,
    width: "28%",
  },
  skeletonTitleLine: {
    backgroundColor: "rgba(255,255,255,0.2)",
    height: 18,
    marginTop: 4,
    width: "78%",
  },
  skeletonTitleLineShort: {
    width: "62%",
  },
  skeletonBody: {
    gap: 11,
    marginTop: 28,
  },
  skeletonBodyLineLong: {
    height: 12,
    width: "92%",
  },
  skeletonBodyLine: {
    height: 12,
    width: "78%",
  },
  skeletonBodyLineMedium: {
    height: 12,
    width: "64%",
  },
  skeletonBodyLineShort: {
    width: "48%",
  },
  skeletonActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    marginTop: "auto",
    paddingTop: 30,
  },
  skeletonIconButton: {
    height: 36,
    width: 42,
  },
  skeletonCountButton: {
    height: 36,
    width: 66,
  },
  postsState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
    paddingHorizontal: 24,
  },
  postsErrorText: {
    color: COLORS.text,
    fontSize: 14, fontWeight: "700",
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
    fontSize: 12, fontWeight: "800",
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
    fontSize: 24, fontWeight: "900",
    lineHeight: 30,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14, fontWeight: "700",
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
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 16,
    fontWeight: "400",
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
  animatedFilterIcon: {
    height: 20,
    justifyContent: "center",
    width: 22,
  },
  filterIconLine: {
    backgroundColor: COLORS.text,
    borderRadius: 999,
    height: 3,
    marginVertical: 3,
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
    fontSize: 12, fontWeight: "800",
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
    overflow: "hidden",
  },
  postButtonLocked: {
    backgroundColor: "rgba(201, 178, 89, 0.64)",
  },
  postButtonIcon: {
    width: 26,
    height: 26,
    tintColor: "#000",
  },
  postButtonIconLocked: {
    opacity: 0.42,
    filter: [{ blur: 4 }],
  },
  postButtonLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(12, 12, 12, 0.42)",
    justifyContent: "center",
  },
});
