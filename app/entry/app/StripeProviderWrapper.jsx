import { StripeProvider } from "@stripe/stripe-react-native";

import { STRIPE_PUBLIC_API_KEY } from "../../services/config/apiConfig.js";

export default function StripeProviderWrapper({ children }) {
  if (!STRIPE_PUBLIC_API_KEY) {
    return children;
  }

  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLIC_API_KEY}
      urlScheme="powertrainingcoach"
    >
      {children}
    </StripeProvider>
  );
}
