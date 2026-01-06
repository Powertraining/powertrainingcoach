# Technical Documentation & Resouces

This section acknowledges the key documentation and learning resources that were essential for the development of our React application, particularly for mastering JSX,HTML and design.

## 1. HTML Foundations (The Essentials)
> **[MDN – HTML (The Reference)](https://developer.mozilla.org/en-US/docs/Web/HTML)**
> The absolute reference for all standard HTML elements used in our Views, including `<form>`, `<input>`, and `<button>`, as well as managing `type="password"`, standard attributes, etc.

- **[Forms Structure](https://developer.mozilla.org/en-US/docs/Learn/Forms)**
  Understanding the semantic structure of forms, label association, and UX best practices for submission.
- **[Input Attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input)**
  Crucial for mastering attributes like `value`, `placeholder`, `disabled`, `readOnly`, and input types (`email`, `password`).
---

## 2. React & JSX
> **[React – Writing Markup with JSX](https://react.dev/learn/writing-markup-with-jsx)**
> The official guide explaining the syntax shift from HTML to JSX (e.g., `class` vs `className`, expression interpolation `{}`).

- **[useMemo Hook](https://react.dev/reference/react/useMemo#skipping-expensive-recalculations)** & **[Impact of Memoization](https://www.jstatsoft.org/article/view/v069c01)**
  Used for optimizing expensive calculations or stabilizing object references across renders.

---

## 3. Handle Errors
> **[JavaScript try...catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch)**
  Standard error handling pattern used in our async operations (API calls, Auth).

---

## 4. Styling & Visual Structure
> **[MDN – CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS)**
> The dictionary for all styling properties.

- **[A Guide to Flexbox (CSS-Tricks)](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)**
  Used everywhere for layout management: alignment, centering, and responsive scaling.
- **[Semantic HTML](https://developer.mozilla.org/en-US/docs/Glossary/Semantics)**
  Choosing the right tag (`<section>`, `<article>`, `<nav>`) rather than generic `<div>` soup.
- **[UX: Design Better Forms](https://uxdesign.cc/design-better-forms-96fadca0f49c)**
  Applied principles for cleaner, more user-friendly input fields.
- ** openAI **
  Tools used for improvements, visuals and handling errors. 

---

## 5. Cloud Firestore & Data Security
> **[Firestore Documentation](https://firebase.google.com/docs/firestore)**
> The official guide for structuring our database, querying data, and implementing security rules.

- **[Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)**
  Ensuring data integrity and access control for user-specific data.
- **[Firebase Authentication](https://firebase.google.com/docs/auth)**
  Managing user sign-up, sign-in, and secure session handling.
- **[Firebase Error Handling](https://firebase.google.com/docs/reference/js/firestore_.firestoreerror)**
  Understanding common error codes and best practices for handling them.

## 6. Stripe Payment Interface
> **[Stripe Docs Overview](https://docs.stripe.com/revenue)**
- **[Stripe-React](https://docs.stripe.com/sdks/stripejs-react)**
- **[Subscription-Checkout](https://docs.stripe.com/billing/quickstart?client=react&lang=node)**

---

## 7. State Management & Reactive Programming
> **[MobX Documentation](https://mobx.js.org/)**
> Observable-based state management system for creating reactive, efficient component updates.

- **[MobX React Integration](https://mobx-react.js.org/)**
  Using the `observer` HOC to make React components reactive to MobX state changes.
- **[Creating Observables](https://mobx.js.org/observable.html)**
  Structuring reactive models for application state.

---

## 8. Client-Side Routing
> **[React Router Documentation](https://reactrouter.com/)**
> Navigation and routing for single-page applications.

- **[useNavigate Hook](https://reactrouter.com/en/main/hooks/use-navigate)**
  Programmatic navigation between different views.
- **[useLocation Hook](https://reactrouter.com/en/main/hooks/use-location)**
  Accessing URL parameters and query strings for subscription success handling.

---

## 9. Build Tools & Development Environment
> **[Vite Documentation](https://vitejs.dev/)**
> Modern build tool providing fast development server and optimized production builds.

- **[Vite Configuration](https://vitejs.dev/config/)**
  Setting up React plugin, server port, and build options.
- **[Hot Module Replacement (HMR)](https://vitejs.dev/guide/hmr.html)**
  Fast development experience with instant updates.

---

## 10. Cloud Functions & Backend Logic
> **[Firebase Cloud Functions](https://firebase.google.com/docs/functions)**
> Serverless backend for AI-powered training plan generation and payment processing.

- **[Callable HTTPS Functions](https://firebase.google.com/docs/functions/callable)**
  Used for `generateTrainingPlan` function to safely call OpenAI API from the client.
- **[Firebase Admin SDK](https://firebase.google.com/docs/database/admin/start)**
  Server-side authentication and database operations.

---

## 11. AI/ML Integration
> **[OpenAI API Documentation](https://platform.openai.com/docs/api-reference)**
> GPT-powered text generation for creating personalized training programs.

- **[Chat Completions API](https://platform.openai.com/docs/guides/gpt)**
  Used in `generatePlan.js` to generate detailed, context-aware training plans.
- **[Prompt Engineering](https://platform.openai.com/docs/guides/prompt-engineering)**
  Crafting effective prompts in `promptBuilder.js` for consistent, high-quality outputs.

---

## 12. Testing & Quality Assurance
> **[Jest Documentation](https://jestjs.io/)**
> JavaScript testing framework for unit and integration tests.

- **[Testing Library for React](https://testing-library.com/react)**
  User-centric testing approach for React components.
- **[Stripe Testing](https://stripe.com/docs/testing)**
  Using test card numbers and webhook endpoints for Stripe integration testing.

---

## 13. JavaScript Standards & Best Practices
> **[MDN – JavaScript Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript)**
> The comprehensive resource for JavaScript language features.

- **[ES6+ Features](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)**
  Arrow functions, destructuring, spread operators, async/await.
- **[Promises & Async/Await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous)**
  Handling asynchronous operations in API calls and authentication flows.

---

## 14. Additional Resources
- **[OpenAI Platform](https://openai.com/)** - AI model provider
- **[Firebase Console](https://console.firebase.google.com/)** - Backend configuration and monitoring
- **[Stripe Dashboard](https://dashboard.stripe.com/)** - Payment processing and subscription management
- **[YouTube Embedded Videos](https://developers.google.com/youtube/iframe_api_reference)** - Tutorial video integration
- **[Font Awesome Icons](https://fontawesome.com/)** - Icon library (if used for UI elements)

## 15. Grok AI
- **[Stripe Subscription Integration](https://grok.com/share/c2hhcmQtNQ_8c8bdb90-6e5e-4a7a-9504-4e032b45aeef)**

## 16. ChatGPT
- **[Design custom GPT API](https://chatgpt.com/share/6921fec2-7724-800c-920b-0850dc0d393a)**
- **[Tech stack for web app](https://chatgpt.com/share/69496071-653c-800c-ab90-9e3b48976471)**
- **[Payment form framework](https://chatgpt.com/share/6949608e-a888-800c-8828-e1ad1135888d)**

## 17. GitHub Copilot

Improve Workflow by using GitHub Copilot. Unfortunately, no link to a chat can be exported as chat is local. Refer to project members if questions arise.