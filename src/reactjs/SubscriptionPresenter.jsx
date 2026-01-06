// Code taken from Stripe's official docs: https://stripe.com/docs/billing/subscriptions/checkout

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SubscriptionPlanView from '/src/views/SubscriptionPlanView.jsx';
import PaymentSuccessView from '/src/views/PaymentSuccessView.jsx';
import MessageView from '/src/views/MessageView.jsx';
import { observer } from "mobx-react-lite";
import { saveUserData } from '/src/models/dbService.js';

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
      if (plan && props.model.user && props.model.user.uid) {
        console.log('[SubscriptionPresenter] User is ready, updating subscription');
        props.model.setSubscriptionWithPlan(plan);
        console.log("✅ Subscription updated in model:", {
          subscription: true,
          subscriptionEndDate: props.model.subscriptionEndDate,
          plan: plan,
          userId: props.model.user.uid
        });
        
        // Directly save to Firestore immediately to bypass the race condition
        saveUserData(props.model.user.uid, {
          subscription: true,
          subscriptionEndDate: props.model.subscriptionEndDate,
        }).then(() => {
          console.log('[SubscriptionPresenter] ✅ Subscription saved directly to Firestore');
        }).catch(error => {
          console.error('[SubscriptionPresenter] ❌ Error saving subscription:', error);
        });
      } else if (plan && !props.model.user) {
        console.log('[SubscriptionPresenter] ⚠️ User not available yet, will retry');
        // User not available, will retry when props change
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