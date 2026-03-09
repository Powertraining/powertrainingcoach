import { View, Text, TouchableOpacity } from "react-native";

export default function ErrorView({ message, onRetry }) {
  return (
    <View>
      <Text>{message}</Text>
      <TouchableOpacity onPress={onRetry}>
        <Text>Try again</Text>
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