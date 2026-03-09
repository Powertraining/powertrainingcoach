// npx expo install @stripe/stripe-react-native to add Stripe's React Native SDK

import { View, Text } from "react-native";

export default function MessageView({ message }) {
  return (
    <View>
      <Text>{message}</Text>
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