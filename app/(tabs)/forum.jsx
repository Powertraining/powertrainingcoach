import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";
import CoachResponseView from "../../src/screens/forum/coachResponseView.jsx";
import CommentsView from "../../src/screens/forum/commentsView.jsx";
import ForumView from "../../src/screens/forum/ForumView.jsx";
import MakePostView from "../../src/screens/forum/makePostView.jsx";
import PostView from "../../src/screens/forum/postView.jsx";

const ForumScreen = observer(function ForumScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [currentView, setCurrentView] = useState("feed");
  const [isCoachResponseVisible, setIsCoachResponseVisible] = useState(false);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [createPostError, setCreatePostError] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [isCreatingComment, setIsCreatingComment] = useState(false);
  const [createCommentError, setCreateCommentError] = useState(null);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [isCreatingReply, setIsCreatingReply] = useState(false);
  const [createReplyError, setCreateReplyError] = useState(null);
  const [isSearchFiltersVisible, setIsSearchFiltersVisible] = useState(false);

  useEffect(() => {
    if (!model.ready || !model.user || model.forumFeed.length > 0) {
      return;
    }

    model.loadForumFeed().catch((error) => {
      console.warn("Could not load the forum feed:", error);
    });
  }, [model, model.forumFeed.length, model.ready, model.user]);

  useEffect(() => {
    if (!isCoachResponseVisible && !isCommentsVisible) {
      return;
    }

    hideForumOverlay();
  }, [model.forumOverlayDismissCount]);

  const feedError = model.forumFeedPromiseState?.error;
  const isFeedLoading =
    model.ready &&
    Boolean(model.user) &&
    model.forumFeed.length === 0 &&
    !feedError &&
    !model.forumFeedPromiseState?.data;

  const coachComments =
    selectedPostId === model.forumSelectedPost?.id ?
      model.getFlattenedForumComments().filter((comment) => comment?.isCoachVerified) :
      [];
  const selectedPost =
    (selectedPostId === model.forumSelectedPost?.id ? model.forumSelectedPost : null) ||
    model.forumFeed.find((post) => post?.id === selectedPostId) ||
    null;

  async function handleRetry() {
    try {
      await model.loadForumFeed();
    } catch (error) {
      console.warn("Could not reload the forum feed:", error);
    }
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
      await model.toggleForumPostSave(postId);
    } catch (error) {
      console.warn(`Could not toggle the forum save for ${postId}:`, error);
    }
  }

  function handlePressPostButton() {
    model.resetForumComposer();
    model.updateForumComposer(model.getDefaultForumPostDraft());
    setCreatePostError(null);
    setCurrentView("compose");
  }

  function handleComposeTextChange(body) {
    const normalizedBody = String(body ?? "");
    const derivedTitle =
      normalizedBody
        .trim()
        .split(/\r?\n/)[0]
        ?.trim()
        .slice(0, 140) || model.getDefaultForumPostDraft().title;

    model.updateForumComposer({
      title: derivedTitle,
      body: normalizedBody,
    });
  }

  function handleDiscardPost() {
    if (isCreatingPost) {
      return;
    }

    setCreatePostError(null);
    model.resetForumComposer();
    setCurrentView("feed");
  }

  function handleUploadImage() {
    console.warn("Image upload is not wired yet.");
  }

  async function handleCreatePost() {
    setCreatePostError(null);
    setIsCreatingPost(true);

    try {
      const createdPost = await model.createForumPost();
      setSelectedPostId(createdPost?.id || null);
      setCurrentView("post");
    } catch (error) {
      console.warn("Could not create the forum post:", error);
      setCreatePostError(error?.message || "Could not create the forum post.");
    } finally {
      setIsCreatingPost(false);
    }
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

  function showPostView(postId) {
    setSelectedPostId(postId);
    setCreateCommentError(null);
    resetReplyComposer();
    setCurrentView("post");

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

  function hidePostView() {
    setSelectedPostId(null);
    setCommentDraft("");
    setCreateCommentError(null);
    resetReplyComposer();
    setCurrentView("feed");
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
      setCreateCommentError(
        error?.message || "Could not create the forum comment."
      );
    } finally {
      setIsCreatingComment(false);
    }
  }

  async function handleCreateReply() {
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
      setCreateReplyError(error?.message || "Could not create the forum reply.");
    } finally {
      setIsCreatingReply(false);
    }
  }

  async function handleSearchQueryChange(searchQuery) {
    try {
      model.setForumFilters({ searchQuery });
      await model.loadForumFeed({ searchQuery });
    } catch (error) {
      console.warn("Could not update the forum search query:", error);
    }
  }

  function toggleSearchFiltersView() {
    setIsSearchFiltersVisible((isVisible) => !isVisible);
  }

  function hideSearchFiltersView() {
    setIsSearchFiltersVisible(false);
  }

  async function handleForumFilterChange(filterPatch = {}) {
    try {
      const nextFilters = {
        ...model.forumFilters,
        ...(filterPatch || {}),
      };
      model.setForumFilters(nextFilters);
      await model.loadForumFeed(nextFilters);
    } catch (error) {
      console.warn("Could not update the forum filters:", error);
    }
  }

  async function handleResetForumFilters() {
    try {
      model.resetForumFilters();
      await model.loadForumFeed(model.forumFilters);
    } catch (error) {
      console.warn("Could not reset the forum filters:", error);
    }
  }

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

  return (
    <View style={styles.container}>
      {currentView === "feed" ? (
        <ForumView
          posts={model.forumFeed}
          isPostsLoading={isFeedLoading}
          postsError={feedError && model.forumFeed.length === 0 ? feedError : null}
          searchQuery={model.forumFilters?.searchQuery || ""}
          filters={model.forumFilters}
          isSearchFiltersVisible={isSearchFiltersVisible}
          onChangeSearchQuery={handleSearchQueryChange}
          onPressSearchFiltersButton={toggleSearchFiltersView}
          onCloseSearchFilters={hideSearchFiltersView}
          onChangeFilterTopic={(topics) => handleForumFilterChange({ topics, topic: "all" })}
          onChangeFilterSortBy={(sortBy) => handleForumFilterChange({ sortBy })}
          onResetFilters={handleResetForumFilters}
          onTogglePostLike={handleTogglePostLike}
          onTogglePostSave={handleTogglePostSave}
          onToggleCoachResponse={showCoachResponseView}
          onPressPostButton={handlePressPostButton}
          onRetryPosts={handleRetry}
          onPressComments={showCommentsView}
          onPressPost={showPostView}
        />
      ) : null}
      {currentView === "compose" ? (
        <MakePostView
          value={model.forumComposer?.body || ""}
          userPhotoUrl={model.user?.photoURL || ""}
          isSubmitting={isCreatingPost}
          error={createPostError}
          onChangeText={handleComposeTextChange}
          onPost={handleCreatePost}
          onUploadImage={handleUploadImage}
          onDiscard={handleDiscardPost}
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
          onChangeCommentText={setCommentDraft}
          onCreateComment={handleCreateComment}
          onPressReply={handlePressReply}
          onChangeReplyText={setReplyDraft}
          onCreateReply={handleCreateReply}
          onCancelReply={resetReplyComposer}
        />
      ) : null}
    </View>
  );
});

export default ForumScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
