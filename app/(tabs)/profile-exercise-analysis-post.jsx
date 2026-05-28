import {
  useEffect,
  useState } from "react";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams,
  useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import ExerciseAnalysisPostView from "../../src/screens/profile/ExerciseAnalysisPostView.jsx";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";
import ExpandingRouteView from "../../src/components/navigation/ExpandingRouteView.jsx";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import {
  getParamValue,
  getSafeReturnToPath,
} from "../../src/services/utils/navigation.js";
import { useAndroidBackHandler } from "../../src/services/utils/useAndroidBackHandler.js";

const ProfileExerciseAnalysisPostScreen = observer(function ProfileExerciseAnalysisPostScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();
  const postId = String(getParamValue(params.postId) || "");
  const returnTo = getSafeReturnToPath(params, "/(tabs)/profile-subscription-details");
  const [commentDraft, setCommentDraft] = useState("");
  const [isCreatingComment, setIsCreatingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!model.ready || !model.user || !postId) {
      return;
    }

    setLoadError(null);
    model.loadForumPostThread(postId).catch((error) => {
      console.warn(`Could not load exercise analysis post ${postId}:`, error);
      const message = error?.message || "Could not load the exercise analysis.";
      setLoadError(message);
      model.showError?.(error, "Could not load the exercise analysis. Please try again.");
    });
  }, [model, model.ready, model.user, postId]);

  function goBack() {
    router.replace(returnTo);
  }

  useAndroidBackHandler(goBack, [returnTo, router]);

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

  const selectedPost =
    (postId && postId === model.forumSelectedPost?.id ? model.forumSelectedPost : null) ||
    model.forumAnalysisPosts?.find((post) => post?.id === postId) ||
    null;
  const isLoading = Boolean(
    postId &&
      model.forumSelectedPostPromiseState?.promise &&
      !model.forumSelectedPostPromiseState?.data &&
      !model.forumSelectedPostPromiseState?.error
  );
  const comments =
    postId === model.forumSelectedPost?.id ? model.getFlattenedForumComments() : [];
  const isCommentsLoading = Boolean(
    postId &&
      model.forumCommentsPromiseState?.promise &&
      !model.forumCommentsPromiseState?.data &&
      !model.forumCommentsPromiseState?.error
  );

  async function handleCreateComment() {
    if (!postId || isCreatingComment) {
      return;
    }

    if (!commentDraft.trim()) {
      return;
    }

    setCommentError(null);
    setIsCreatingComment(true);

    try {
      await model.addForumComment(postId, commentDraft);
      setCommentDraft("");
    } catch (error) {
      console.warn("Could not add exercise analysis comment:", error);
      const message = error?.message || "Could not send the reply.";
      setCommentError(message);
      model.showError?.(error, "Could not send the reply. Please try again.");
    } finally {
      setIsCreatingComment(false);
    }
  }

  if (!selectedPost && isLoading) {
    return (
      <View style={styles.container}>
        <LoadingView />
      </View>
    );
  }

  return (
    <ExpandingRouteView routeKey={`profile-exercise-analysis-post-${postId}`}>
      <ExerciseAnalysisPostView
        post={selectedPost}
        comments={comments}
        commentValue={commentDraft}
        commentError={commentError || loadError}
        isLoading={isLoading || isCommentsLoading}
        isSubmittingComment={isCreatingComment}
        currentUserId={model.user?.uid || ""}
        onBack={goBack}
        onChangeCommentText={setCommentDraft}
        onCreateComment={handleCreateComment}
      />
    </ExpandingRouteView>
  );
});

export default ProfileExerciseAnalysisPostScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
