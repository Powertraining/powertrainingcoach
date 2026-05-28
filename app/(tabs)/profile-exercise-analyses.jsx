import {
  useCallback,
  useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useFocusEffect,
  useLocalSearchParams,
  useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import ExerciseAnalysisListView from "../../src/screens/profile/ExerciseAnalysisListView.jsx";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";
import ExpandingRouteView from "../../src/components/navigation/ExpandingRouteView.jsx";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import { getSafeReturnToPath } from "../../src/services/utils/navigation.js";
import { useAndroidBackHandler } from "../../src/services/utils/useAndroidBackHandler.js";

const ProfileExerciseAnalysesScreen = observer(function ProfileExerciseAnalysesScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();
  const returnTo = getSafeReturnToPath(params, "/(tabs)/profile-subscription-details");

  useFocusEffect(
    useCallback(() => {
      if (!model.ready || !model.user) {
        return undefined;
      }

      model.loadMyAnalysisForumPosts?.().catch((error) => {
        console.warn("Could not load exercise analysis archive:", error);
      });

      return undefined;
    }, [model, model.ready, model.user])
  );

  function goBack() {
    router.replace(returnTo);
  }

  useAndroidBackHandler(goBack, [returnTo, router]);

  const posts = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return (model.forumAnalysisPosts || []).filter((post) => {
      const createdAt = Date.parse(post?.createdAt || "");

      if (!Number.isFinite(createdAt)) {
        return true;
      }

      const createdDate = new Date(createdAt);
      return (
        createdDate.getMonth() !== currentMonth ||
        createdDate.getFullYear() !== currentYear
      );
    });
  }, [model.forumAnalysisPosts]);

  function openPost(post) {
    if (!post?.id) {
      return;
    }

    router.push({
      pathname: "/(tabs)/profile-exercise-analysis-post",
      params: {
        postId: post.id,
        returnTo: "/(tabs)/profile-exercise-analyses",
      },
    });
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
    <ExpandingRouteView routeKey="profile-exercise-analyses">
      <ExerciseAnalysisListView
        posts={posts}
        onBack={goBack}
        onPressPost={openPost}
      />
    </ExpandingRouteView>
  );
});

export default ProfileExerciseAnalysesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
