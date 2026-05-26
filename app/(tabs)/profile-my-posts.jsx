import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";
import CoachResponseView from "../../src/screens/forum/coachResponseView.jsx";
import CommentsView from "../../src/screens/forum/commentsView.jsx";
import MakePostView from "../../src/screens/forum/makePostView.jsx";
import PostView from "../../src/screens/forum/postView.jsx";
import SavedPostsView from "../../src/screens/profile/SavedPostsView.jsx";
import {
  pickForumImage,
  pickForumVideo,
  uploadForumMedia,
} from "../../src/services/utils/mediaUpload.js";

const ProfileMyPostsScreen = observer(function ProfileMyPostsScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [currentView, setCurrentView] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCoachResponseVisible, setIsCoachResponseVisible] = useState(false);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isUploadingPostMedia, setIsUploadingPostMedia] = useState(false);
  const [createPostError, setCreatePostError] = useState(null);
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
    model.myForumPosts = [];
    model.myForumPostsPromiseState = {};
    model.loadMyForumPosts().catch((error) => {
      console.warn("Could not load user forum posts:", error);
    });
  }, [model, model.ready, model.user]);

  useEffect(() => {
    if (!isCoachResponseVisible && !isCommentsVisible) {
      return;
    }

    hideForumOverlay();
  }, [model.forumOverlayDismissCount]);

  const feedError = model.myForumPostsPromiseState?.error;
  const isFeedLoading =
    model.ready &&
    Boolean(model.user) &&
    model.myForumPosts.length === 0 &&
    !feedError &&
    !model.myForumPostsPromiseState?.data;
  const canUseForumActions = model.isSubscribed?.() || false;
  const selectedPost =
    (selectedPostId === model.forumSelectedPost?.id ? model.forumSelectedPost : null) ||
    model.myForumPosts.find((post) => post?.id === selectedPostId) ||
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
    router.push("/(tabs)/profile");
  }

  async function reloadMyPosts(filterOverrides = {}) {
    try {
      await model.loadMyForumPosts(filterOverrides);
    } catch (error) {
      console.warn("Could not reload user forum posts:", error);
    }
  }

  async function handleSearchQueryChange(nextSearchQuery) {
    setSearchQuery(nextSearchQuery);
    await reloadMyPosts({ searchQuery: nextSearchQuery });
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
      setCurrentView("composeLocked");
      return;
    }

    model.resetForumComposer();
    model.updateForumComposer(model.getDefaultForumPostDraft());
    setCreatePostError(null);
    setCurrentView("compose");
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
        .filter((tag) => tag && tag !== "coach") :
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
  }

  function handleLeavePostComposer() {
    if (isCreatingPost || isUploadingPostMedia) {
      return;
    }

    setCreatePostError(null);
    model.resetForumComposer();
    setCurrentView("list");
  }

  async function handleUploadMedia(mediaType = "image") {
    setCreatePostError(null);

    try {
      const asset =
        mediaType === "video" ? await pickForumVideo() : await pickForumImage();

      if (!asset) {
        return;
      }

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
    }
  }

  function handleRemoveMedia() {
    setCreatePostError(null);
    model.updateForumComposer({
      mediaUrl: "",
      mediaType: "none",
    });
  }

  async function handleCreatePost() {
    if (!canUseForumActions) {
      return;
    }

    if (isUploadingPostMedia) {
      return;
    }

    setCreatePostError(null);
    setIsCreatingPost(true);

    try {
      const createdPost = await model.createForumPost();
      setSelectedPostId(createdPost?.id || null);
      await reloadMyPosts(model.forumFilters);
      setCurrentView("post");
    } catch (error) {
      console.warn("Could not create the forum post:", error);
      setCreatePostError(error?.message || "Could not create the forum post.");
    } finally {
      setIsCreatingPost(false);
    }
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

  return (
    <View style={styles.container}>
      {currentView === "list" ? (
        <SavedPostsView
          posts={model.myForumPosts}
          isLoading={isFeedLoading}
          error={feedError && model.myForumPosts.length === 0 ? feedError : null}
          title="My posts"
          searchPlaceholder="Search my posts"
          emptyText="Posts you create will show up here."
          errorText="Could not load your posts."
          searchQuery={searchQuery}
          onBack={backToProfile}
          onChangeSearchQuery={handleSearchQueryChange}
          onRetry={() => reloadMyPosts(model.forumFilters)}
          onTogglePostLike={handleTogglePostLike}
          onTogglePostSave={handleTogglePostSave}
          onToggleCoachResponse={showCoachResponseView}
          onPressComments={showCommentsView}
          onPressPost={showPostView}
          showPostButton
          isPostButtonLocked={!canUseForumActions}
          onPressPostButton={handlePressPostButton}
        />
      ) : null}
      {currentView === "compose" ? (
        <MakePostView
          titleValue={model.forumComposer?.title || ""}
          value={model.forumComposer?.body || ""}
          userPhotoUrl={model.user?.photoURL || ""}
          mediaUrl={model.forumComposer?.mediaUrl || ""}
          mediaType={model.forumComposer?.mediaType || "none"}
          isSubmitting={isCreatingPost}
          isUploadingMedia={isUploadingPostMedia}
          error={createPostError}
          selectedTags={model.forumComposer?.tags || []}
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

export default ProfileMyPostsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
