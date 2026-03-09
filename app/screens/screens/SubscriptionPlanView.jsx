//npx expo install @react-native-async-storage/async-storage   to install AsyncStorage for React Native

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createCheckoutSession } from '../../services/utils/stripeClient.js';

export default function SubscriptionPlanView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async (planKey) => {
    setIsLoading(true);
    setError(null);
    try {
      await AsyncStorage.setItem('selectedPlan', planKey);
      await createCheckoutSession(planKey);
    } catch (err) {
      setError(err.message || 'Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  const plans = [
    { key: 'starter_plan', name: 'Starter Plan (1 week)', price: '20.00 SEK / week' },
    { key: 'pro_plan', name: 'Pro Plan (1 month)', price: '70.00 SEK / month' },
    { key: 'expert_plan', name: 'Expert Plan (1 year)', price: '800.00 SEK / year' },
  ];

  return (
    <View>
      {error && <Text style={styles.error}>{error}</Text>}

      {plans.map((plan, index) => (
        <View key={plan.key}>
          <View style={styles.product}>
            <Text>💪</Text>
            <View style={styles.description}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text>Cancellable anytime</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleCheckout(plan.key)}
              disabled={isLoading}
            >
              <Text>{isLoading ? 'Processing...' : 'Checkout'}</Text>
            </TouchableOpacity>
          </View>
          {index < plans.length - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  error: { color: '#dc2626' },
  product: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  description: { flex: 1, gap: 4 },
  planName: { fontSize: 16, fontWeight: '700' },
  planPrice: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
});



// // Code taken from Stripe's official docs: https://stripe.com/docs/billing/subscriptions/checkout
// import { createCheckoutSession } from '../../services/utils/stripeClient.js';
// import { useState } from 'react';

// export default function subscriptionPlanView() {
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const handleCheckout = async (planKey) => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       // Store the selected plan for later use after checkout
//       sessionStorage.setItem('selectedPlan', planKey);
//       await createCheckoutSession(planKey);
//     } catch (err) {
//       setError(err.message || 'Failed to start checkout. Please try again.');
//       setIsLoading(false);
//     }
//   };

//   return (
//     <section className="subscription-plan-container">
//       {error && (
//         <div className="subscription-plan-error">
//           {error}
//         </div>
//       )}

//       <div className="subscription-product">
//         <div className="subscription-product-icon">💪</div>
//         <div className="subscription-product-description">
//           <h3>Starter Plan (1 week)</h3>
//           <h5>20.00 SEK / week</h5>
//           <p>Cancellable anytime</p>
//         </div>
//         <button
//           onClick={() => handleCheckout('starter_plan')}
//           disabled={isLoading}
//           className="subscription-plan-checkout-button"
//         >
//           {isLoading ? 'Processing...' : 'Checkout'}
//         </button>
//       </div>

//       <div className="subscription-divider" />

//       <div className="subscription-product">
//         <div className="subscription-product-icon">💪</div>
//         <div className="subscription-product-description">
//           <h3>Pro Plan (1 month)</h3>
//           <h5>70.00 SEK / month</h5>
//           <p>Cancellable anytime</p>
//         </div>
//         <button
//           onClick={() => handleCheckout('pro_plan')}
//           disabled={isLoading}
//           className="subscription-plan-checkout-button"
//         >
//           {isLoading ? 'Processing...' : 'Checkout'}
//         </button>
//       </div>

//       <div className="subscription-divider" />

//       <div className="subscription-product">
//         <div className="subscription-product-icon">💪</div>
//         <div className="subscription-product-description">
//           <h3>Expert Plan (1 year)</h3>
//           <h5>800.00 SEK / year</h5>
//           <p>Cancellable anytime</p>
//         </div>
//         <button
//           onClick={() => handleCheckout('expert_plan')}
//           disabled={isLoading}
//           className="subscription-plan-checkout-button"
//         >
//           {isLoading ? 'Processing...' : 'Checkout'}
//         </button>
//       </div>
//     </section>
//   );
// };