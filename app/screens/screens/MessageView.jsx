// Code taken from Stripe's official docs: https://stripe.com/docs/billing/subscriptions/checkout

export default function MessageView({ message }){
  return (
    <section>
      <p>{message}</p>
    </section>
  );
};