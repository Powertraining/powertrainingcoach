import {
  useEffect,
  useLayoutEffect,
  useState } from "react";
import { observer } from "mobx-react-lite";
import { Redirect,
  useLocalSearchParams,
  usePathname,
  useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import LoadingView from "../../src/screens/LoadingView.jsx";
import CoachResponseView from "../../src/screens/forum/coachResponseView.jsx";
import CommentsView from "../../src/screens/forum/commentsView.jsx";
import ForumView from "../../src/screens/forum/ForumView.jsx";
import MakePostView from "../../src/screens/forum/makePostView.jsx";
import PostView from "../../src/screens/forum/postView.jsx";
import {
  pickForumImage,
  pickForumVideo,
  uploadForumMedia,
} from "../../src/services/utils/mediaUpload.js";
import { useAndroidBackHandler } from "../../src/services/utils/useAndroidBackHandler.js";

function buildForumReturnTo(pathname, params) {
  if (typeof pathname !== "string" || !pathname.startsWith("/")) {
    return "/(tabs)/forum";
  }

  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (typeof entry === "string") {
          searchParams.append(key, entry);
        }
      });
      return;
    }

    if (typeof value === "string") {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

const ForumScreen = observer(function ForumScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [currentView, setCurrentView] = useState("feed");
  const [isCoachResponseVisible, setIsCoachResponseVisible] = useState(false);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isUploadingPostMedia, setIsUploadingPostMedia] = useState(false);
  const [postMediaPreview, setPostMediaPreview] = useState({
    mediaUrl: "",
    mediaType: "none",
  });
  const [createPostError, setCreatePostError] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [isCreatingComment, setIsCreatingComment] = useState(false);
  const [createCommentError, setCreateCommentError] = useState(null);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [isCreatingReply, setIsCreatingReply] = useState(false);
  const [createReplyError, setCreateReplyError] = useState(null);
  const [isSearchFiltersVisible, setIsSearchFiltersVisible] = useState(false);
  const [canTagAnalysisPosts, setCanTagAnalysisPosts] = useState(false);

  useEffect(() => {
    if (!model.ready || !model.user || model.forumFeed.length > 0) {
      return;
    }

    model.loadForumFeed().catch((error) => {
      console.warn("Could not load the forum feed:", error);
    });
  }, [model, model.forumFeed.length, model.ready, model.user]);

  useEffect(() => {
    let isActive = true;

    if (!model.ready || !model.user) {
      setCanTagAnalysisPosts(false);
      return () => {
        isActive = false;
      };
    }

    model.getForumAuthorMeta()
      .then((authorMeta) => {
        if (isActive) {
          setCanTagAnalysisPosts(Boolean(authorMeta?.isCoachVerified));
        }
      })
      .catch((error) => {
        console.warn("Could not load forum author role:", error);
        if (isActive) {
          setCanTagAnalysisPosts(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [model, model.ready, model.user]);

  useEffect(() => {
    const routeSearchQuery =
      typeof params.searchQuery === "string" ? params.searchQuery.trim() : "";

    if (!model.ready || !model.user || !routeSearchQuery) {
      return;
    }

    setForumCurrentView("feed");
    model.setForumFilters({ searchQuery: routeSearchQuery });
    router.replace("/(tabs)/forum");
    model.loadForumFeed({ searchQuery: routeSearchQuery }).catch((error) => {
      console.warn("Could not load forum search results:", error);
    });
  }, [model, model.ready, model.user, params.searchQuery, router]);

  useEffect(() => {
    if (!isCoachResponseVisible && !isCommentsVisible) {
      return;
    }

    hideForumOverlay();
  }, [model.forumOverlayDismissCount]);

  useLayoutEffect(() => {
    model.setForumTabBarHidden(
      currentView === "post" ||
        currentView === "compose" ||
        currentView === "composeLocked"
    );
  }, [currentView, model]);

  useEffect(() => {
    return () => {
      model.setForumTabBarHidden(false);
    };
  }, [model]);

  const feedError = model.forumFeedPromiseState?.error;
  const isFeedLoading =
    model.ready &&
    Boolean(model.user) &&
    model.forumFeed.length === 0 &&
    !feedError &&
    !model.forumFeedPromiseState?.data;
  const canUseForumActions = model.isSubscribed?.() || false;
  const isForumTabHiddenView = (view) =>
    view === "post" || view === "compose" || view === "composeLocked";

  function setForumCurrentView(view) {
    model.setForumTabBarHidden(isForumTabHiddenView(view));
    setCurrentView(view);
  }

  const coachComments =
    selectedPostId === model.forumSelectedPost?.id ?
      model.getFlattenedForumComments().filter((comment) => comment?.isCoachVerified) :
      [];
  const selectedPost =
    (selectedPostId === model.forumSelectedPost?.id ? model.forumSelectedPost : null) ||
    model.forumFeed.find((post) => post?.id === selectedPostId) ||
    null;
  const isCommentsLoading = Boolean(
    selectedPostId &&
      model.forumCommentsPromiseState?.promise &&
      !model.forumCommentsPromiseState?.data &&
      !model.forumCommentsPromiseState?.error
  );

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
    if (!canUseForumActions) {
      setForumCurrentView("composeLocked");
      return;
    }

    model.resetForumComposer();
    model.updateForumComposer(model.getDefaultForumPostDraft());
    setCreatePostError(null);
    setForumCurrentView("compose");
  }

  function handleComposeTitleChange(title) {
    model.updateForumComposer({
      title: String(title ?? "").slice(0, 140),
    });
  }

  function handleComposeTextChange(body) {
    model.updateForumComposer({
      body: String(body ?? ""),
    });
  }

  function handleComposeTagsChange(tags = []) {
    const normalizedTags = Array.isArray(tags) ?
      tags
        .map((tag) => String(tag ?? "").trim().toLowerCase())
        .filter((tag) =>
          tag &&
          tag !== "coach" &&
          (canTagAnalysisPosts || tag !== "analysis")
        ) :
      [];

    model.updateForumComposer({
      tags: normalizedTags,
      topic: normalizedTags[0] || model.getDefaultForumPostDraft().topic,
    });
  }

  function handleClearPostDraft() {
    const defaultDraft = model.getDefaultForumPostDraft();

    setCreatePostError(null);
    model.updateForumComposer({
      title: "",
      body: "",
      tags: [],
      topic: defaultDraft.topic,
      mediaUrl: "",
      mediaType: "none",
    });
    setPostMediaPreview({ mediaUrl: "", mediaType: "none" });
  }

  function handleLeavePostComposer() {
    if (isCreatingPost || isUploadingPostMedia) {
      return;
    }

    setCreatePostError(null);
    model.resetForumComposer();
    setPostMediaPreview({ mediaUrl: "", mediaType: "none" });
    setForumCurrentView("feed");
  }

  async function handleUploadMedia(mediaType = "image") {
    setCreatePostError(null);

    try {
      const asset =
        mediaType === "video" ? await pickForumVideo() : await pickForumImage();

      if (!asset) {
        return;
      }

      setPostMediaPreview({
        mediaUrl: asset.uri,
        mediaType,
      });
      setIsUploadingPostMedia(true);
      const uploadedMedia = await uploadForumMedia({
        asset,
        mediaType,
        ownerId: model.user?.uid,
      });

      model.updateForumComposer({
        mediaUrl: uploadedMedia.url,
        mediaType: uploadedMedia.mediaType,
      });
    } catch (error) {
      console.warn("Could not upload forum media:", error);
      setCreatePostError(error?.message || "Could not upload media.");
    } finally {
      setIsUploadingPostMedia(false);
      setPostMediaPreview({ mediaUrl: "", mediaType: "none" });
    }
  }

  function handleRemoveMedia() {
    setCreatePostError(null);
    model.updateForumComposer({
      mediaUrl: "",
      mediaType: "none",
    });
    setPostMediaPreview({ mediaUrl: "", mediaType: "none" });
  }

  async function handleCreatePost() {
    if (isUploadingPostMedia) {
      return;
    }

    setCreatePostError(null);
    setIsCreatingPost(true);

    try {
      const createdPost = await model.createForumPost();
      setSelectedPostId(createdPost?.id || null);
      setForumCurrentView("post");
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
    setForumCurrentView("post");

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
    setForumCurrentView("feed");
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
      setCreateCommentError(
        error?.message || "Could not create the forum comment."
      );
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

  async function handlePostTopicPress(topic) {
    const normalizedTopic = String(topic ?? "").trim().toLowerCase();

    if (!normalizedTopic) {
      return;
    }

    hideSearchFiltersView();
    await handleForumFilterChange({ topics: [normalizedTopic], topic: "all" });
  }

  useAndroidBackHandler(() => {
    if (isCoachResponseVisible || isCommentsVisible) {
      hideForumOverlay();
      return;
    }

    if (isSearchFiltersVisible) {
      hideSearchFiltersView();
      return;
    }

    if (currentView === "compose" || currentView === "composeLocked") {
      handleLeavePostComposer();
      return;
    }

    if (currentView === "post") {
      hidePostView();
      return;
    }

    return false;
  }, [
    currentView,
    isCoachResponseVisible,
    isCommentsVisible,
    isCreatingPost,
    isSearchFiltersVisible,
    isUploadingPostMedia,
  ]);

  if (!model.ready) {
    return (
      <View style={styles.container}>
        <LoadingView />
      </View>
    );
  }

  if (!model.user) {
    return (
      <Redirect
        href={{
          pathname: "/(auth)/login",
          params: { returnTo: buildForumReturnTo(pathname, params) },
        }}
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
          isPostButtonLocked={!canUseForumActions}
          onRetryPosts={handleRetry}
          onPressComments={showCommentsView}
          onPressPost={showPostView}
          onPressTopic={handlePostTopicPress}
        />
      ) : null}
      {currentView === "compose" ? (
        <MakePostView
          titleValue={model.forumComposer?.title || ""}
          value={model.forumComposer?.body || ""}
          userPhotoUrl={model.user?.photoURL || ""}
          mediaUrl={model.forumComposer?.mediaUrl || ""}
          mediaType={model.forumComposer?.mediaType || "none"}
          previewMediaUrl={postMediaPreview.mediaUrl}
          previewMediaType={postMediaPreview.mediaType}
          isSubmitting={isCreatingPost}
          isUploadingMedia={isUploadingPostMedia}
          error={createPostError}
          selectedTags={model.forumComposer?.tags || []}
          allowAnalysisTag={canTagAnalysisPosts}
          onChangeTitle={handleComposeTitleChange}
          onChangeText={handleComposeTextChange}
          onChangeTags={handleComposeTagsChange}
          onPost={handleCreatePost}
          onUploadImage={() => handleUploadMedia("image")}
          onUploadVideo={() => handleUploadMedia("video")}
          onRemoveMedia={handleRemoveMedia}
          onBack={handleLeavePostComposer}
          onDiscard={handleClearPostDraft}
        />
      ) : null}
      {currentView === "composeLocked" ? (
        <MakePostView
          titleValue="Post title"
          value="Share your training question, progress update, or discussion topic."
          userPhotoUrl={model.user?.photoURL || ""}
          selectedTags={["training"]}
          locked
          onBack={handleLeavePostComposer}
          onDiscard={handleClearPostDraft}
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
  );
});

export default ForumScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
