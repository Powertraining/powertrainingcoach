import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import FeedBackView from "../../src/screens/FeedBackView.jsx";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";

const FeedbackScreen = observer(function FeedbackScreen() {
  const model = reactiveModel;
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (model.user && model.ready && model.finishedWorkout !== 3) {
      router.replace("/(tabs)");
    }
  }, [model.finishedWorkout, model.ready, model.user, router]);

  if (!model.ready) {
    return (
      <View style={styles.container}>
        <LoadingView />
      </View>
    );
  }

  // Check auth
  if (!model.user) {
    return (
      <AuthGateView
        onLogin={() => router.push("/(auth)/login")}
        onSignup={() => router.push("/(auth)/signup")}
      />
    );
  }

  // Check if user should be on feedback page
  if (model.finishedWorkout !== 3) {
    return null;
  }

  async function handleSubmit() {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Submit feedback to model/backend
      await model.submitFeedback?.({
        rating,
        comment,
      });

      // Reset finished workout state
      model.setFinishedWorkout?.(0);

      // Clear training plan to start fresh
      model.archiveCurrentTrainingPlan?.();
      model.trainingPlan = null;
      model.completedDays = [];

      // Navigate back to home
      router.replace("/(tabs)");
    } catch (e) {
      console.error("Error submitting feedback:", e);
      setError(e.message || "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSkip() {
    // Reset finished workout state
    model.setFinishedWorkout?.(0);

    // Clear training plan to start fresh
    model.archiveCurrentTrainingPlan?.();
    model.trainingPlan = null;
    model.completedDays = [];

    // Navigate back to home
    router.replace("/(tabs)");
  }

  return (
    <View style={styles.container}>
      <FeedBackView
        rating={rating}
        comment={comment}
        isSubmitting={isSubmitting}
        error={error}
        onRatingChange={setRating}
        onCommentChange={setComment}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
      />
    </View>
  );
});

export default FeedbackScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
