import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import AuthGateView from "../../src/screens/screens/auth/AuthGateView.jsx";
import ErrorView from "../../src/screens/screens/ErrorView.jsx";
import LoadingView from "../../src/screens/screens/LoadingView.jsx";
import CoachResponseView from "../../src/screens/screens/forum/coachResponseView.jsx";
import CommentsView from "../../src/screens/screens/forum/commentsView.jsx";
import ForumView from "../../src/screens/screens/forum/ForumView.jsx";
import MakePostView from "../../src/screens/screens/forum/makePostView.jsx";
import PostView from "../../src/screens/screens/forum/postView.jsx";

const ForumScreen = observer(function ForumScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [currentView, setCurrentView] = useState("feed");
  const [isCoachResponseVisible, setIsCoachResponseVisible] = useState(false);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [createPostError, setCreatePostError] = useState(null);

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

  useEffect(() => {
    model.setForumTabBarHidden(currentView === "compose");

    return () => {
      model.setForumTabBarHidden(false);
    };
  }, [currentView, model]);

  const feedError = model.forumFeedPromiseState?.error;
  const isFeedLoading =
    model.ready &&
    Boolean(model.user) &&
    model.forumFeed.length === 0 &&
    !feedError &&
    !model.forumFeedPromiseState?.data;

  const coachComments =
    selectedPostId === model.forumSelectedPost?.id ?
      model.forumComments.filter((comment) => comment?.isCoachVerified) :
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
    setIsCoachResponseVisible(true);
    model.setForumOverlayVisible(true);

    model.loadForumPostThread(postId).catch((error) => {
      console.warn(`Could not load the forum thread for ${postId}:`, error);
    });
  }

  function showCommentsView(postId) {
    setSelectedPostId(postId);
    setIsCommentsVisible(true);
    model.setForumOverlayVisible(true);

    model.loadForumPostThread(postId).catch((error) => {
      console.warn(`Could not load the forum thread for ${postId}:`, error);
    });
  }

  function showPostView(postId) {
    setSelectedPostId(postId);
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
    model.setForumOverlayVisible(false);
  }

  function hidePostView() {
    setSelectedPostId(null);
    setCurrentView("feed");
  }

  function hideForumOverlay() {
    setIsCoachResponseVisible(false);
    setIsCommentsVisible(false);
    model.setForumOverlayVisible(false);
  }

  if (!model.ready || isFeedLoading) {
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

  if (feedError && model.forumFeed.length === 0) {
    return (
      <View style={styles.container}>
        <ErrorView
          message={feedError.message || "Could not load the forum feed."}
          onRetry={handleRetry}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentView === "feed" ? (
        <ForumView
          posts={model.forumFeed}
          onTogglePostLike={handleTogglePostLike}
          onTogglePostSave={handleTogglePostSave}
          onToggleCoachResponse={showCoachResponseView}
          onPressPostButton={handlePressPostButton}
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
          onBack={hidePostView}
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
