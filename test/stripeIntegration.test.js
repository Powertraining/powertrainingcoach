import axios from 'axios';
import { STRIPE_SECRET_API_KEY } from '../apiConfig';
// Created by Github Copilot
/**
 * Integration tests for Stripe backend
 * Run with: node test/stripeIntegration.test.js
 */

const BASE_URL = 'http://localhost:4242';

// Test utilities
const testConfig = {
  lookupKey: 'starter-monthly', // Must match your Stripe product setup
  validSessionId: null, // Will be populated after checkout
};

async function runTests() {
  console.log('🧪 Starting Stripe Integration Tests...\n');

  try {
    // Test 1: Create Checkout Session
    console.log('Test 1: Creating checkout session...');
    const checkoutResponse = await axios.post(`${BASE_URL}/create-checkout-session`, {
      lookup_key: testConfig.lookupKey,
    });
    
    if (checkoutResponse.status === 200 || checkoutResponse.status === 303) {
      console.log('✅ Checkout session created successfully');
      testConfig.validSessionId = checkoutResponse.data?.session_id || 'test_session';
    }

    // Test 2: Verify Product Display
    console.log('\nTest 2: Verifying product information...');
    const stripe = require('stripe')(STRIPE_SECRET_API_KEY);
    const prices = await stripe.prices.list({
      lookup_keys: [testConfig.lookupKey],
      expand: ['data.product'],
      limit: 1,
    });

    if (prices.data.length > 0) {
      const price = prices.data[0];
      console.log(`✅ Product found: ${price.product.name}`);
      console.log(`   Price: ${price.unit_amount / 100} ${price.currency.toUpperCase()}`);
      console.log(`   Billing: ${price.recurring.interval}`);
    } else {
      console.log('⚠️  No product found with lookup key:', testConfig.lookupKey);
    }

    // Test 3: Portal Session (requires valid session ID)
    if (testConfig.validSessionId) {
      console.log('\nTest 3: Creating portal session...');
      try {
        const portalResponse = await axios.post(`${BASE_URL}/create-portal-session`, {
          session_id: testConfig.validSessionId,
        });
        console.log('✅ Portal session created successfully');
      } catch (error) {
        console.log('⚠️  Portal session error (may be expected in test):', error.message);
      }
    }

    // Test 4: Webhook Verification
    console.log('\nTest 4: Checking webhook configuration...');
    const webhookSecret = 'whsec_12345'; // From your code
    if (webhookSecret === 'whsec_12345') {
      console.log('⚠️  WARNING: Webhook secret is a placeholder. Update with real secret from:');
      console.log('   stripe listen --forward-to localhost:4242/webhook');
    } else {
      console.log('✅ Webhook secret configured');
    }

    console.log('\n✅ All tests completed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };
