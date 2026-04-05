import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import AuthGateView from "../../src/screens/screens/auth/AuthGateView.jsx";
import ErrorView from "../../src/screens/screens/ErrorView.jsx";
import LoadingView from "../../src/screens/screens/LoadingView.jsx";
import CoachResponseView from "../../src/screens/screens/forum/coachResponseView.jsx";
import ForumView from "../../src/screens/screens/forum/ForumView.jsx";

const ForumScreen = observer(function ForumScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isCoachResponseVisible, setIsCoachResponseVisible] = useState(false);

  useEffect(() => {
    if (!model.ready || !model.user || model.forumFeed.length > 0) {
      return;
    }

    model.loadForumFeed().catch((error) => {
      console.warn("Could not load the forum feed:", error);
    });
  }, [model, model.forumFeed.length, model.ready, model.user]);

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
    try {
      model.createFakeForumPost();
    } catch (error) {
      console.warn("Could not create the fake forum post:", error);
    }
  }

  function showCoachResponseView(postId) {
    setSelectedPostId(postId);
    setIsCoachResponseVisible(true);

    model.loadForumPostThread(postId).catch((error) => {
      console.warn(`Could not load the forum thread for ${postId}:`, error);
    });
  }

  function hideCoachResponseView() {
    setSelectedPostId(null);
    setIsCoachResponseVisible(false);
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
      <ForumView
        posts={model.forumFeed}
        onTogglePostLike={handleTogglePostLike}
        onTogglePostSave={handleTogglePostSave}
        onToggleCoachResponse={showCoachResponseView}
        onPressPostButton={handlePressPostButton}
      />
      {isCoachResponseVisible ? (
        <CoachResponseView
          onClose={hideCoachResponseView}
          comments={coachComments}
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
