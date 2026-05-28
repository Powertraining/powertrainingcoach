// npx expo install @stripe/stripe-react-native to add Stripe's React Native SDK

import { View } from "react-native";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";

export default function MessageView({ message }) {
  return (
    <View>
      <IBMPlexText>{message}</IBMPlexText>
    </View>
  );
}

// Code taken from Stripe's official docs: https://stripe.com/docs/billing/subscriptions/checkout

// export default function MessageView({ message }){
//   return (
//     <section>
//       <p>{message}</p>
//     </section>
//   );
// };