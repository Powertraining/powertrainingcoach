// Code taken from Stripe's official docs: https://stripe.com/docs/billing/subscriptions/checkout
import { createCheckoutSession } from '../utils/stripeClient.js';
import { useState } from 'react';

export default function subscriptionPlanView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async (planKey) => {
    setIsLoading(true);
    setError(null);
    try {
      // Store the selected plan for later use after checkout
      sessionStorage.setItem('selectedPlan', planKey);
      await createCheckoutSession(planKey);
    } catch (err) {
      setError(err.message || 'Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <section className="subscription-plan-container">
      {error && (
        <div className="subscription-plan-error">
          {error}
        </div>
      )}

      <div className="subscription-product">
        <div className="subscription-product-icon">💪</div>
        <div className="subscription-product-description">
          <h3>Starter Plan (1 week)</h3>
          <h5>20.00 SEK / week</h5>
          <p>Cancellable anytime</p>
        </div>
        <button
          onClick={() => handleCheckout('starter_plan')}
          disabled={isLoading}
          className="subscription-plan-checkout-button"
        >
          {isLoading ? 'Processing...' : 'Checkout'}
        </button>
      </div>

      <div className="subscription-divider" />

      <div className="subscription-product">
        <div className="subscription-product-icon">💪</div>
        <div className="subscription-product-description">
          <h3>Pro Plan (1 month)</h3>
          <h5>70.00 SEK / month</h5>
          <p>Cancellable anytime</p>
        </div>
        <button
          onClick={() => handleCheckout('pro_plan')}
          disabled={isLoading}
          className="subscription-plan-checkout-button"
        >
          {isLoading ? 'Processing...' : 'Checkout'}
        </button>
      </div>

      <div className="subscription-divider" />

      <div className="subscription-product">
        <div className="subscription-product-icon">💪</div>
        <div className="subscription-product-description">
          <h3>Expert Plan (1 year)</h3>
          <h5>800.00 SEK / year</h5>
          <p>Cancellable anytime</p>
        </div>
        <button
          onClick={() => handleCheckout('expert_plan')}
          disabled={isLoading}
          className="subscription-plan-checkout-button"
        >
          {isLoading ? 'Processing...' : 'Checkout'}
        </button>
      </div>
    </section>
  );
};