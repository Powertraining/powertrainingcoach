import {
  useEffect,
  useState } from "react";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams,
  useRouter } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";
import ExpandingRouteView from "../../src/components/navigation/ExpandingRouteView.jsx";
import CoachResponseView from "../../src/screens/forum/coachResponseView.jsx";
import CommentsView from "../../src/screens/forum/commentsView.jsx";
import PostView from "../../src/screens/forum/postView.jsx";
import SavedPostsView from "../../src/screens/profile/SavedPostsView.jsx";
import { getSafeReturnToPath } from "../../src/services/utils/navigation.js";
import { useAndroidBackHandler } from "../../src/services/utils/useAndroidBackHandler.js";

const ProfileSavedPostsScreen = observer(function ProfileSavedPostsScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();
  const returnTo = getSafeReturnToPath(params, "/(tabs)/profile");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [currentView, setCurrentView] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCoachResponseVisible, setIsCoachResponseVisible] = useState(false);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [isCreatingComment, setIsCreatingComment] = useState(false);
  const [createCommentError, setCreateCommentError] = useState(null);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [isCreatingReply, setIsCreatingReply] = useState(false);
  const [createReplyError, setCreateReplyError] = useState(null);

  useEffect(() => {
    if (!model.ready || !model.user) {
      return;
    }

    model.resetForumFilters();
    model.savedForumPosts = [];
    model.savedForumPostsPromiseState = {};
    model.loadSavedForumPosts().catch((error) => {
      console.warn("Could not load saved forum posts:", error);
    });
  }, [model, model.ready, model.user]);

  useEffect(() => {
    if (!isCoachResponseVisible && !isCommentsVisible) {
      return;
    }

    hideForumOverlay();
  }, [model.forumOverlayDismissCount]);

  const feedError = model.savedForumPostsPromiseState?.error;
  const isFeedLoading =
    model.ready &&
    Boolean(model.user) &&
    model.savedForumPosts.length === 0 &&
    !feedError &&
    !model.savedForumPostsPromiseState?.data;
  const canUseForumActions = model.isSubscribed?.() || false;
  const selectedPost =
    (selectedPostId === model.forumSelectedPost?.id ? model.forumSelectedPost : null) ||
    model.savedForumPosts.find((post) => post?.id === selectedPostId) ||
    null;
  const coachComments =
    selectedPostId === model.forumSelectedPost?.id ?
      model.getFlattenedForumComments().filter((comment) => comment?.isCoachVerified) :
      [];
  const isCommentsLoading = Boolean(
    selectedPostId &&
      model.forumCommentsPromiseState?.promise &&
      !model.forumCommentsPromiseState?.data &&
      !model.forumCommentsPromiseState?.error
  );

  useAndroidBackHandler(() => {
    if (isCoachResponseVisible || isCommentsVisible) {
      hideForumOverlay();
      return;
    }

    if (currentView === "post") {
      hidePostView();
      return;
    }

    backToProfile();
  }, [currentView, isCoachResponseVisible, isCommentsVisible, returnTo, router]);

  if (!model.ready) {
    return (
      <View style={styles.container}>
        <LoadingView />
      </View>
    );
  }

  if (!model.user) {
    return (
      <AuthGateView
        onLogin={() => router.push("/(auth)/login")}
        onSignup={() => router.push("/(auth)/signup")}
      />
    );
  }

  function backToProfile() {
    router.replace(returnTo);
  }

  async function reloadSavedPosts(filterOverrides = {}) {
    try {
      await model.loadSavedForumPosts(filterOverrides);
    } catch (error) {
      console.warn("Could not reload saved forum posts:", error);
    }
  }

  async function handleSearchQueryChange(nextSearchQuery) {
    setSearchQuery(nextSearchQuery);
    await reloadSavedPosts({ searchQuery: nextSearchQuery });
  }

  async function handleTogglePostLike(postId) {
    try {
      await model.toggleForumPostLike(postId);
    } catch (error) {
      console.warn(`Could not toggle the forum like for ${postId}:`, error);
    }
  }

  async function handleTogglePostSave(postId) {
    try {
      const isSaved = await model.toggleForumPostSave(postId);

      if (!isSaved) {
        await reloadSavedPosts(model.forumFilters);
      }
    } catch (error) {
      console.warn(`Could not toggle the forum save for ${postId}:`, error);
    }
  }

  function handleDeletePost(postId) {
    if (!postId) {
      return;
    }

    Alert.alert(
      "Delete post?",
      "This permanently removes the post from the forum.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await model.deleteForumPost(postId);

              if (selectedPostId === postId) {
                hidePostView();
              }
            } catch (error) {
              console.warn(`Could not delete the forum post ${postId}:`, error);
              model.showError?.(error, "Could not delete the forum post. Please try again.");
            }
          },
        },
      ]
    );
  }

  function showPostView(postId) {
    setSelectedPostId(postId);
    setCreateCommentError(null);
    resetReplyComposer();
    setCurrentView("post");

    model.loadForumPostThread(postId).catch((error) => {
      console.warn(`Could not load the forum thread for ${postId}:`, error);
    });
  }

  function hidePostView() {
    setSelectedPostId(null);
    setCommentDraft("");
    setCreateCommentError(null);
    resetReplyComposer();
    setCurrentView("list");
  }

  function showCoachResponseView(postId) {
    setSelectedPostId(postId);
    resetReplyComposer();
    setIsCoachResponseVisible(true);
    model.setForumOverlayVisible(true);

    model.loadForumPostThread(postId).catch((error) => {
      console.warn(`Could not load the forum thread for ${postId}:`, error);
    });
  }

  function showCommentsView(postId) {
    setSelectedPostId(postId);
    resetReplyComposer();
    setIsCommentsVisible(true);
    model.setForumOverlayVisible(true);

    model.loadForumPostThread(postId).catch((error) => {
      console.warn(`Could not load the forum thread for ${postId}:`, error);
    });
  }

  function hideCoachResponseView() {
    setIsCoachResponseVisible(false);
    model.setForumOverlayVisible(false);
  }

  function hideCommentsView() {
    setIsCommentsVisible(false);
    resetReplyComposer();
    model.setForumOverlayVisible(false);
  }

  function hideForumOverlay() {
    setIsCoachResponseVisible(false);
    setIsCommentsVisible(false);
    resetReplyComposer();
    model.setForumOverlayVisible(false);
  }

  function resetReplyComposer() {
    setActiveReplyCommentId(null);
    setReplyDraft("");
    setCreateReplyError(null);
  }

  function handlePressReply(comment) {
    if (!comment?.id || isCreatingReply) {
      return;
    }

    setCreateReplyError(null);
    setReplyDraft("");
    setActiveReplyCommentId((currentReplyCommentId) =>
      currentReplyCommentId === comment.id ? null : comment.id
    );
  }

  async function handleCreateComment() {
    if (!canUseForumActions) {
      return;
    }

    if (!selectedPost?.id || isCreatingComment) {
      return;
    }

    setCreateCommentError(null);
    setIsCreatingComment(true);

    try {
      await model.addForumComment(selectedPost.id, commentDraft);
      setCommentDraft("");
    } catch (error) {
      console.warn("Could not create the forum comment:", error);
      const message = error?.message || "Could not create the forum comment.";
      setCreateCommentError(message);
      model.showError?.(error, "Could not post your comment. Please try again.");
    } finally {
      setIsCreatingComment(false);
    }
  }

  async function handleCreateReply() {
    if (!canUseForumActions) {
      return;
    }

    if (!selectedPost?.id || !activeReplyCommentId || isCreatingReply) {
      return;
    }

    setCreateReplyError(null);
    setIsCreatingReply(true);

    try {
      await model.addForumReply(selectedPost.id, activeReplyCommentId, replyDraft);
      resetReplyComposer();
    } catch (error) {
      console.warn("Could not create the forum reply:", error);
      const message = error?.message || "Could not create the forum reply.";
      setCreateReplyError(message);
      model.showError?.(error, "Could not post your reply. Please try again.");
    } finally {
      setIsCreatingReply(false);
    }
  }

  return (
    <ExpandingRouteView routeKey="profile-saved-posts">
      <View style={styles.container}>
      {currentView === "list" ? (
        <SavedPostsView
          posts={model.savedForumPosts}
          isLoading={isFeedLoading}
          error={feedError && model.savedForumPosts.length === 0 ? feedError : null}
          searchQuery={searchQuery}
          onBack={backToProfile}
          onChangeSearchQuery={handleSearchQueryChange}
          onRetry={() => reloadSavedPosts(model.forumFilters)}
          onTogglePostLike={handleTogglePostLike}
          onTogglePostSave={handleTogglePostSave}
          onToggleCoachResponse={showCoachResponseView}
          onPressComments={showCommentsView}
          onPressPost={showPostView}
        />
      ) : null}
      {currentView === "post" ? (
        <PostView
          post={selectedPost}
          comments={selectedPostId === model.forumSelectedPost?.id ? model.forumComments : []}
          commentValue={commentDraft}
          commentError={createCommentError}
          activeReplyCommentId={activeReplyCommentId}
          replyValue={replyDraft}
          replyError={createReplyError}
          currentUserPhotoUrl={model.user?.photoURL || ""}
          isSubmittingComment={isCreatingComment}
          isSubmittingReply={isCreatingReply}
          isCommentsLoading={isCommentsLoading}
          commentsLocked={!canUseForumActions}
          hideTabBar
          onBack={hidePostView}
          onChangeCommentText={setCommentDraft}
          onCreateComment={handleCreateComment}
          onPressReply={handlePressReply}
          onChangeReplyText={setReplyDraft}
          onCreateReply={handleCreateReply}
          onCancelReply={resetReplyComposer}
          onTogglePostLike={handleTogglePostLike}
          onTogglePostSave={handleTogglePostSave}
          onToggleCoachResponse={showCoachResponseView}
          onDeletePost={handleDeletePost}
          currentUserId={model.user?.uid || ""}
          onPressComments={showCommentsView}
        />
      ) : null}
      {isCoachResponseVisible ? (
        <CoachResponseView
          onClose={hideCoachResponseView}
          comments={coachComments}
        />
      ) : null}
      {isCommentsVisible ? (
        <CommentsView
          onClose={hideCommentsView}
          comments={
            selectedPostId === model.forumSelectedPost?.id ? model.forumComments : []
          }
          commentValue={commentDraft}
          commentError={createCommentError}
          activeReplyCommentId={activeReplyCommentId}
          replyValue={replyDraft}
          replyError={createReplyError}
          currentUserPhotoUrl={model.user?.photoURL || ""}
          isSubmittingComment={isCreatingComment}
          isSubmittingReply={isCreatingReply}
          isCommentsLoading={isCommentsLoading}
          commentsLocked={!canUseForumActions}
          onChangeCommentText={setCommentDraft}
          onCreateComment={handleCreateComment}
          onPressReply={handlePressReply}
          onChangeReplyText={setReplyDraft}
          onCreateReply={handleCreateReply}
          onCancelReply={resetReplyComposer}
        />
      ) : null}
      </View>
    </ExpandingRouteView>
  );
});

export default ProfileSavedPostsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
