import { View, TouchableOpacity } from "react-native";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
export default function ErrorView({ message, onRetry }) {
  return (
    <View>
      <IBMPlexText>{message}</IBMPlexText>
      <TouchableOpacity onPress={onRetry}>
        <IBMPlexText>Try again</IBMPlexText>
      </TouchableOpacity>
    </View>
  );
}

// export default function ErrorView({ message, onRetry }) {
//   return (
//     <div className="error-view-container">
//       <p>{message}</p>
//       <button onClick={onRetry}>Try again</button>
//     </div>
//   );
// }