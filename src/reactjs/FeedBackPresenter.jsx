import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { FeedBackView } from "/src/views/FeedBackView.jsx";

const FeedBack = observer(function FeedBack(props) {
  const model = props.model;
  const navigate = useNavigate();

  // Local UI state (allowed by your course instructor)
  const [rating, setRating] = useState(0);        // 0..10
  const [comment, setComment] = useState("");

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function ratingChangeACB(value) {
    setRating(value);
  }

  function commentChangeACB(value) {
    setComment(value);
  }

  function trainingDoneACB() {
    props.model.setDailyTrainingState("done");
  }

  async function submitACB(evt) {
    evt.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // NOTE: update your model method signature accordingly:
      // submitFeedBack(rating, comment)
      await model.submitFeedBack(rating, comment);

      // Optional: clear UI after success
      setRating(0);
      setComment("");

      // Redirect if you want (or remove if you prefer to stay on the page)
      props.model.setFinishedWorkout(0);
      navigate("/");

    } catch (e) {
      console.error(e);
      const message = e.message || "Unable to send feedback. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FeedBackView
      rating={rating}
      comment={comment}
      isSubmitting={isSubmitting}
      error={error}
      onRatingChange={ratingChangeACB}
      onCommentChange={commentChangeACB}
      onSubmit={submitACB}
      onTrainingDone={trainingDoneACB}
    />
  );
});

export { FeedBack };
