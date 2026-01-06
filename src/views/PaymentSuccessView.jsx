// Code taken from Stripe's official docs: https://stripe.com/docs/billing/subscriptions/checkout
import { createPortalSession } from '/src/utils/stripeClient.js';

export default function PaymentSuccessView({ sessionId }){
  const handleManageBilling = async () => {
    try {
      await createPortalSession(sessionId);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <section className="payment-success-container">
      <div className="payment-success-product">
        <div className="payment-success-icon">💪</div>
        <h3>✓ Subscription Successful!</h3>
        <p>Thank you for your purchase. Your subscription is now active.</p>
      </div>
      <button 
        className="payment-success-button"
        onClick={handleManageBilling}
      >
        Manage your billing information
      </button>
    </section>
  );
};