import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Subscription from '../src/views/SubscriptionView.jsx';
import { STRIPE_PUBLIC_API_KEY } from '../src/config/apiConfig.js';

// Mock stripe modules
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn().mockResolvedValue({
    elements: jest.fn(),
    createPaymentMethod: jest.fn(),
  }),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => children,
  CardElement: () => null,
  useElements: () => ({}),
  useStripe: () => ({}),
}));

describe('Stripe Subscription Integration', () => {
  beforeEach(() => {
    // Reset URL parameters
    delete window.location;
    window.location = { href: '', search: '' };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: ProductDisplay renders correctly
  test('should render ProductDisplay with correct pricing', () => {
    render(<Subscription />);

    expect(screen.getByText('Starter Plan')).toBeInTheDocument();
    expect(screen.getByText(/20.00/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Checkout/i })).toBeInTheDocument();
  });

  // Test 2: Checkout form submission
  test('should submit checkout form with lookup_key', async () => {
    render(<Subscription />);

    const form = screen.getByRole('button', { name: /Checkout/i }).closest('form');
    expect(form).toHaveAttribute('action', '/create-checkout-session');
    expect(form).toHaveAttribute('method', 'POST');

    const hiddenInput = form.querySelector('input[type="hidden"][name="lookup_key"]');
    expect(hiddenInput).toBeInTheDocument();
  });

  // Test 3: Success redirect handling
  test('should handle successful checkout redirect', async () => {
    // Simulate URL with success parameters
    window.location.search = '?success=true&session_id=cs_test_123';

    render(<Subscription />);

    await waitFor(() => {
      expect(screen.getByText(/Subscription to Starter Plan successful!/)).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('cs_test_123')).toBeInTheDocument();
  });

  // Test 4: Portal session form
  test('should render manage billing form after successful subscription', async () => {
    window.location.search = '?success=true&session_id=cs_test_123';

    render(<Subscription />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Manage your billing/i })).toBeInTheDocument();
    });

    const portalForm = screen.getByRole('button', { name: /Manage your billing/i }).closest('form');
    expect(portalForm).toHaveAttribute('action', '/create-portal-session');
    expect(portalForm).toHaveAttribute('method', 'POST');
  });

  // Test 5: Canceled checkout
  test('should handle canceled checkout', async () => {
    window.location.search = '?canceled=true';

    render(<Subscription />);

    await waitFor(() => {
      expect(screen.getByText(/Order canceled/)).toBeInTheDocument();
    });
  });

  // Test 6: Component renders without crashing
  test('should render component successfully', () => {
    const { container } = render(<Subscription />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
