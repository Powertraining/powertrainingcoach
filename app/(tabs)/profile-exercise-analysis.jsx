import {
  useEffect,
  useState } from "react";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams,
  useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import ExerciseAnalysisRequestView from "../../src/screens/profile/ExerciseAnalysisRequestView.jsx";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";
import ExpandingRouteView from "../../src/components/navigation/ExpandingRouteView.jsx";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import {
  ANALYSIS_FORUM_TAG,
  getAnalysisForumExerciseId,
} from "../../src/services/models/forumModel.js";
import {
  pickForumVideo,
  uploadForumMedia,
} from "../../src/services/utils/mediaUpload.js";
import {
  getParamValue,
  getSafeReturnToPath,
} from "../../src/services/utils/navigation.js";
import { useAndroidBackHandler } from "../../src/services/utils/useAndroidBackHandler.js";

const ProfileExerciseAnalysisScreen = observer(function ProfileExerciseAnalysisScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();
  const returnTo = getSafeReturnToPath(params, "/(tabs)/profile-subscription-details");
  const analysisSlot = String(getParamValue(params.slot) || "");
  const analysisExerciseId = getAnalysisForumExerciseId(analysisSlot);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!model.ready || !model.user) {
      return;
    }

    model.resetForumComposer();
    model.updateForumComposer({
      ...model.getDefaultForumPostDraft(),
      tags: [ANALYSIS_FORUM_TAG],
      topic: "general",
      exerciseId: analysisExerciseId,
      coachResponseRequested: true,
      mediaType: "none",
      mediaUrl: "",
    });
    setError(null);
    setPreviewVideoUrl("");
  }, [analysisExerciseId, model, model.ready, model.user]);

  function goBack() {
    if (isSubmitting || isUploadingVideo) {
      return;
    }

    model.resetForumComposer();
    setPreviewVideoUrl("");
    setError(null);
    router.replace(returnTo);
  }

  useAndroidBackHandler(goBack, [
    isSubmitting,
    isUploadingVideo,
    model,
    returnTo,
    router,
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
      <AuthGateView
        onLogin={() => router.push("/(auth)/login")}
        onSignup={() => router.push("/(auth)/signup")}
      />
    );
  }

  function handleExerciseNameChange(exerciseName) {
    const normalizedExerciseName = String(exerciseName ?? "").slice(0, 140);

    model.updateForumComposer({
      title: normalizedExerciseName,
      exerciseName: normalizedExerciseName,
    });
  }

  function handleDescriptionChange(body) {
    model.updateForumComposer({
      body: String(body ?? ""),
    });
  }

  async function handleUploadVideo() {
    if (isSubmitting || isUploadingVideo) {
      return;
    }

    setError(null);

    try {
      const asset = await pickForumVideo();

      if (!asset) {
        return;
      }

      setPreviewVideoUrl(asset.uri);
      setIsUploadingVideo(true);
      const uploadedMedia = await uploadForumMedia({
        asset,
        mediaType: "video",
        ownerId: model.user?.uid,
      });

      model.updateForumComposer({
        mediaUrl: uploadedMedia.url,
        mediaType: "video",
      });
    } catch (uploadError) {
      console.warn("Could not upload exercise analysis video:", uploadError);
      setError(uploadError?.message || "Could not upload video.");
    } finally {
      setIsUploadingVideo(false);
      setPreviewVideoUrl("");
    }
  }

  function handleRemoveVideo() {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setPreviewVideoUrl("");
    model.updateForumComposer({
      mediaUrl: "",
      mediaType: "none",
    });
  }

  function handleDiscard() {
    if (isSubmitting || isUploadingVideo) {
      return;
    }

    setError(null);
    setPreviewVideoUrl("");
    model.updateForumComposer({
      title: "",
      body: "",
      exerciseName: "",
      exerciseId: analysisExerciseId,
      mediaUrl: "",
      mediaType: "none",
      tags: [ANALYSIS_FORUM_TAG],
      topic: "general",
      coachResponseRequested: true,
    });
  }

  async function handleSend() {
    if (isSubmitting || isUploadingVideo) {
      return;
    }

    const title = String(model.forumComposer?.title || "").trim();
    const mediaUrl = String(model.forumComposer?.mediaUrl || "").trim();
    const mediaType = model.forumComposer?.mediaType;

    if (!title) {
      setError("Exercise name is required.");
      return;
    }

    if (!mediaUrl || mediaType !== "video") {
      setError("A video is required before sending.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await model.createForumPost({
        title,
        exerciseId: analysisExerciseId,
        exerciseName: title,
        body: model.forumComposer?.body || "",
        mediaUrl,
        mediaType: "video",
        tags: [ANALYSIS_FORUM_TAG],
        topic: "general",
        coachResponseRequested: true,
      });
      router.replace(returnTo);
    } catch (sendError) {
      console.warn("Could not send exercise analysis request:", sendError);
      setError(sendError?.message || "Could not send the exercise analysis.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ExpandingRouteView routeKey={`profile-exercise-analysis-${analysisSlot}`}>
      <ExerciseAnalysisRequestView
        exerciseName={model.forumComposer?.title || ""}
        description={model.forumComposer?.body || ""}
        videoUrl={
          model.forumComposer?.mediaType === "video" ? model.forumComposer?.mediaUrl || "" : ""
        }
        previewVideoUrl={previewVideoUrl}
        isUploadingVideo={isUploadingVideo}
        isSubmitting={isSubmitting}
        error={error}
        onBack={goBack}
        onChangeExerciseName={handleExerciseNameChange}
        onChangeDescription={handleDescriptionChange}
        onUploadVideo={handleUploadVideo}
        onRemoveVideo={handleRemoveVideo}
        onDiscard={handleDiscard}
        onSend={handleSend}
      />
    </ExpandingRouteView>
  );
});

export default ProfileExerciseAnalysisScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
