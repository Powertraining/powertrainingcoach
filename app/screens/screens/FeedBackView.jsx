import { useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";

export function FeedBackView(props) {
  const stars = Array.from({ length: 10 }, (_, i) => i + 1);

  useEffect(() => {
    props.onTrainingDone();
  }, []);

  function starClickedACB(value) {
    if (!props.isSubmitting) {
      props.onRatingChange(value);
    }
  }

  return (
    <View>
      <Text>Session Feedback: How was the workout plan provided to you?</Text>

      <View style={styles.stars}>
        {stars.map((value) => (
          <TouchableOpacity
            key={value}
            onPress={() => starClickedACB(value)}
            disabled={props.isSubmitting}
          >
            <Text style={value <= props.rating ? styles.starActive : styles.star}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.scale}>
        <Text>1</Text>
        <Text>10</Text>
      </View>

      <TextInput
        placeholder="Type feedback here..."
        value={props.comment}
        onChangeText={props.onCommentChange}
        multiline
        numberOfLines={5}
        editable={!props.isSubmitting}
      />

      {props.error && <Text>{props.error}</Text>}

      <TouchableOpacity
        onPress={props.onSubmit}
        disabled={props.isSubmitting || props.rating === 0}
      >
        <Text>{props.isSubmitting ? "Sending..." : "Send feedback"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  stars: { flexDirection: "row" },
  scale: { flexDirection: "row", justifyContent: "space-between" },
  star: { fontSize: 24, color: "#ccc" },
  starActive: { fontSize: 24, color: "#f59e0b" },
});

// import "/src/style.css";

// export function FeedBackView(props) {
//   const stars = Array.from({ length: 10 }, (_, i) => i + 1);
//   function starClickedACB(value) {
//     if (!props.isSubmitting) {
//       props.onRatingChange(value);
//     }
//   }

//   function commentChangedACB(evt) {
//     props.onCommentChange(evt.target.value);
//   }

//   function markTrainingDoneACB(evt) {
//     props.onTrainingDone();
//   }

//   return (
//     <div onLoad={markTrainingDoneACB} className="feedback-page">
//       <h2 className="feedback-question">Session Feedback: How was the workout plan provided to you?</h2>

//       <div className="feedback-stars" aria-label="Workout rating from 1 to 10">
//         {stars.map((value) => (
//           <button
//             key={value}
//             type="button"
//             className={
//               "feedback-star " +
//               (value <= props.rating ? "feedback-star--active" : "")
//             }
//             onClick={() => starClickedACB(value)}
//             aria-label={`Rate ${value} out of 10`}
//             aria-pressed={value <= props.rating}
//             disabled={props.isSubmitting}
//           >
//             ★
//           </button>
//         ))}
//       </div>

//       <div className="feedback-scale">
//         <span className="feedback-scale-left">1</span>
//         <span className="feedback-scale-right">10</span>
//       </div>

//       <form className="feedback-form" onSubmit={props.onSubmit}>
//         <textarea
//           className="feedback-textarea"
//           placeholder="Type feedback here..."
//           value={props.comment}
//           onChange={commentChangedACB}
//           rows={5}
//           disabled={props.isSubmitting}
//         />

//         {props.error && <p className="feedback-error">{props.error}</p>}

//         <button
//           className="feedback-submit"
//           type="submit"
//           disabled={props.isSubmitting || props.rating === 0}
//           title={props.rating === 0 ? "Please select a rating first" : "Send feedback"}
//         >
//           {props.isSubmitting ? "Sending..." : "Send feedback"}
//         </button>
//       </form>
//     </div>
//   );
// }
