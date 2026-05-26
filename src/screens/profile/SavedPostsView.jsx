import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PostCard from "../../components/forumComponents/PostCard.jsx";
import LockIcon from "../../components/LockIcon.jsx";
import QuestionnaireShell from "../questionnaire/QuestionnaireShell.jsx";

const COLORS = {
  panel: "#141414",
  text: "#ffffff",
  muted: "#9ca3af",
  panelBorder: "#1E1E1E",
};
const SKELETON_POSTS = [0, 1, 2, 3];

function SkeletonBlock({ style }) {
  return <View style={[styles.skeletonBlock, style]} />;
}

function PostListSkeleton({ index = 0 }) {
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

export default function SavedPostsView({
  posts = [],
  isLoading = false,
  error = null,
  title = "Saved Posts",
  searchPlaceholder = "Search saved posts",
  emptyText = "Saved posts will show up here.",
  errorText = "Could not load saved posts.",
  showPostButton = false,
  isPostButtonLocked = false,
  searchQuery = "",
  onBack,
  onChangeSearchQuery,
  onRetry,
  onTogglePostLike,
  onTogglePostSave,
  onToggleCoachResponse,
  onPressPost,
  onPressTopic,
  onPressPostButton,
}) {
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef(null);

  return (
    <QuestionnaireShell hideTabBar={false}>
      <View style={styles.wrapper}>
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
            <View style={styles.skeletonList}>
              {SKELETON_POSTS.map((item) => (
                <PostListSkeleton key={`profile-post-skeleton-${item}`} index={item} />
              ))}
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
        {showPostButton ? (
          <TouchableOpacity
            style={[
              styles.postButton,
              { bottom: Math.max(insets.bottom + 24, 30) },
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
  wrapper: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
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
  postButton: {
    alignItems: "center",
    backgroundColor: "#C9B259",
    borderRadius: 120,
    elevation: 10,
    height: 54,
    justifyContent: "center",
    overflow: "hidden",
    position: "absolute",
    right: 30,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    width: 54,
    zIndex: 10,
  },
  postButtonLocked: {
    backgroundColor: "rgba(201, 178, 89, 0.64)",
  },
  postButtonIcon: {
    height: 26,
    tintColor: "#000",
    width: 26,
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
