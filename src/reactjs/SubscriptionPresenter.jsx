// Code taken from Stripe's official docs: https://stripe.com/docs/billing/subscriptions/checkout

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SubscriptionPlanView from '/src/views/SubscriptionPlanView.jsx';
import PaymentSuccessView from '/src/views/PaymentSuccessView.jsx';
import MessageView from '/src/views/MessageView.jsx';
import { observer } from "mobx-react-lite";

const Subscription =  observer(function Subscription(props) {
  const location = useLocation();
  let [message, setMessage] = useState('');
  let [success, setSuccess] = useState(false);
  let [sessionId, setSessionId] = useState('');
  let [planType, setPlanType] = useState('');

  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    // React Router provides location.search with query parameters
    const query = new URLSearchParams(location.search);
    const successParam = query.get('success');
    const sessionIdParam = query.get('session_id');
    
    console.log('SubscriptionPresenter DEBUG - React Router location:', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    });
    console.log('SubscriptionPresenter DEBUG - Parsed params:', {
      success: successParam,
      session_id: sessionIdParam,
    });

    if (successParam === 'true') {
      console.log('✅ Payment success detected, setting success state');
      setSuccess(true);
      setSessionId(sessionIdParam);
      
      // Get the plan type from the URL or session storage
      const plan = sessionStorage.getItem('selectedPlan');
      setPlanType(plan || '');
      
      // Update the model subscription with the plan end date
      // Persistence is handled automatically by MobX reaction in firebaseModel.js
      if (plan && props.model.user && props.model.user.uid && props.model.ready) {
        console.log('[SubscriptionPresenter] User is ready, updating subscription via model');
        props.model.setSubscriptionWithPlan(plan);
        console.log("✅ Subscription updated in model (will be persisted via MobX reaction):", {
          subscription: true,
          subscriptionEndDate: props.model.subscriptionEndDate,
          plan: plan,
          userId: props.model.user.uid
        });
      } else if (plan && !props.model.user) {
        console.log('[SubscriptionPresenter] ⚠️ User not available yet, will retry when props change');
      } else if (plan && !props.model.ready) {
        console.log('[SubscriptionPresenter] ⚠️ Model not ready yet, will retry when props change');
      }
    }

    if (query.get('canceled')) {
      setSuccess(false);
      setMessage(
        "Order canceled -- continue to check your subscription and checkout when you're ready."
      );
    }
  }, [location, props.model.user, props.model]);

  // Debug: log the current render state
  console.log('SubscriptionPresenter RENDER - Current state:', { success, sessionId, message });

  if (!success && message === '') {
    console.log('📋 Rendering SubscriptionPlanView');
    return <SubscriptionPlanView />;
  } else if (success) {
    console.log('✅ Rendering PaymentSuccessView with sessionId:', sessionId);
    return <PaymentSuccessView sessionId={sessionId} />;
  } else {
    console.log('⚠️ Rendering MessageView with message:', message);
    return <MessageView message={message} />;
  }
});

export { Subscription };
