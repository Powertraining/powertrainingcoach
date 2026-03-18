// Firebase Cloud Functions for Stripe Payment Processing
// Stripe secrets are managed via Firebase Secret Manager

const functions = require("firebase-functions");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const stripe = require("stripe");

// Initialize Firebase Admin
admin.initializeApp();

const FIREBASE_PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.GCP_PROJECT ||
  admin.app().options.projectId ||
  "power-training-coach";
const HOSTING_BASE_URL =
  process.env.HOSTING_BASE_URL || `https://${FIREBASE_PROJECT_ID}.web.app`;
const USER_COLLECTION = "users";
const COMBAT_MODEL_COLLECTION = "combatModel";
const CHECKOUT_SUCCESS_URL =
  `${HOSTING_BASE_URL}/checkout_redirect/success.html`;
const CHECKOUT_CANCEL_URL =
  `${HOSTING_BASE_URL}/checkout_redirect/cancel.html`;
const BILLING_PORTAL_RETURN_URL =
  `${HOSTING_BASE_URL}/checkout_redirect/portal.html`;
const stripeSecretKeyParam = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecretParam = defineSecret("STRIPE_WEBHOOK_SECRET");
const openAiApiKeyParam = defineSecret("OPENAI_API_KEY");

/**
 * @return {FirebaseFirestore.CollectionReference}
 */
function getUsersCollection() {
  return admin.firestore().collection(USER_COLLECTION);
}

/**
 * @return {FirebaseFirestore.CollectionReference}
 */
function getCombatModelCollection() {
  return admin.firestore().collection(COMBAT_MODEL_COLLECTION);
}

/**
 * @param {number|null|undefined} unixTimestamp
 * @return {string|null}
 */
function formatDateFromUnixTimestamp(unixTimestamp) {
  if (!unixTimestamp) {
    return null;
  }

  return new Date(unixTimestamp * 1000).toISOString().slice(0, 10);
}

/**
 * @param {object} subscription
 * @return {boolean}
 */
function isSubscriptionEntitled(subscription) {
  const entitledStatuses = new Set(["active", "trialing"]);

  if (!subscription || !entitledStatuses.has(subscription.status)) {
    return false;
  }

  if (!subscription.current_period_end) {
    return false;
  }

  return subscription.current_period_end * 1000 > Date.now();
}

/**
 * @param {object} object
 * @param {string} key
 * @return {*}
 */
function getObjectMetadataValue(object, key) {
  if (!object || !object.metadata) {
    return null;
  }

  return object.metadata[key] || null;
}

/**
 * @param {Error|object} error
 * @return {boolean}
 */
function hasAuthErrorCode(error) {
  return Boolean(error && error.code && error.code.startsWith("auth/"));
}

/**
 * @param {object} params
 * @param {object} params.stripeClient
 * @param {string|null} params.customerId
 * @return {Promise<string|null>}
 */
async function resolveFirebaseUidForCustomer({stripeClient, customerId}) {
  if (!customerId) {
    return null;
  }

  const customer = await stripeClient.customers.retrieve(customerId);

  if (!customer.deleted) {
    return getObjectMetadataValue(customer, "firebaseUID");
  }

  return null;
}

/**
 * @param {object} params
 * @param {object} params.stripeClient
 * @param {object|string} params.subscription
 * @param {string=} params.fallbackFirebaseUID
 * @return {Promise<object>}
 */
async function syncStripeSubscriptionToFirestore({
  stripeClient,
  subscription,
  fallbackFirebaseUID,
}) {
  let resolvedSubscription = subscription;

  if (!resolvedSubscription || typeof resolvedSubscription === "string") {
    resolvedSubscription = await stripeClient.subscriptions.retrieve(
        resolvedSubscription,
        {expand: ["items.data.price"]},
    );
  } else if (
    !resolvedSubscription.items ||
    !resolvedSubscription.items.data ||
    !resolvedSubscription.items.data[0] ||
    !resolvedSubscription.items.data[0].price
  ) {
    resolvedSubscription = await stripeClient.subscriptions.retrieve(
        resolvedSubscription.id,
        {expand: ["items.data.price"]},
    );
  }

  const customerId = typeof resolvedSubscription.customer === "string" ?
    resolvedSubscription.customer :
    (resolvedSubscription.customer ? resolvedSubscription.customer.id : null);
  const firebaseUID = getObjectMetadataValue(
      resolvedSubscription,
      "firebaseUID",
  ) ||
    fallbackFirebaseUID ||
    await resolveFirebaseUidForCustomer({
      stripeClient,
      customerId,
    });

  if (!firebaseUID) {
    throw new Error("Could not resolve Firebase user for subscription");
  }

  const firstSubscriptionItem = resolvedSubscription.items &&
    resolvedSubscription.items.data &&
    resolvedSubscription.items.data[0] ?
    resolvedSubscription.items.data[0] :
    null;
  const lookupKey = getObjectMetadataValue(resolvedSubscription, "lookupKey") ||
    (firstSubscriptionItem && firstSubscriptionItem.price ?
      firstSubscriptionItem.price.lookup_key :
      null) ||
    null;
  const subscriptionEndDate = formatDateFromUnixTimestamp(
      resolvedSubscription.current_period_end,
  );
  const active = isSubscriptionEntitled(resolvedSubscription);

  await getCombatModelCollection().doc(firebaseUID).set({
    subscription: active,
    subscriptionEndDate,
    stripeSubscriptionId: resolvedSubscription.id,
    stripeCustomerId: customerId || null,
    stripePriceLookupKey: lookupKey,
    subscriptionStatus: resolvedSubscription.status,
    billingProvider: "stripe",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});

  if (customerId) {
    await getUsersCollection().doc(firebaseUID).set({
      stripeCustomerId: customerId,
    }, {merge: true});
  }

  return {
    active,
    customerId: customerId || null,
    firebaseUID,
    lookupKey,
    subscriptionEndDate,
    subscriptionId: resolvedSubscription.id,
    subscriptionStatus: resolvedSubscription.status,
  };
}

/**
 * @param {object} params
 * @param {object} params.stripeClient
 * @param {object} params.invoice
 * @return {Promise<object|null>}
 */
async function syncStripeInvoiceToFirestore({stripeClient, invoice}) {
  const subscriptionId = typeof invoice.subscription === "string" ?
    invoice.subscription :
    (invoice.subscription ? invoice.subscription.id : null);

  if (!subscriptionId) {
    console.log(
        `Invoice ${invoice.id || "unknown"} ` +
        "has no subscription; skipping sync.",
    );
    return null;
  }

  return syncStripeSubscriptionToFirestore({
    stripeClient,
    subscription: subscriptionId,
    fallbackFirebaseUID: getObjectMetadataValue(invoice, "firebaseUID"),
  });
}

/**
 * @param {object} secretParam
 * @param {string} secretName
 * @return {string}
 */
function getRequiredSecretValue(secretParam, secretName) {
  const secretValue = secretParam.value();

  if (!secretValue) {
    throw new Error(`${secretName} is not configured in Secret Manager`);
  }

  return secretValue;
}

/**
 * Verifies the Firebase auth token sent by the client.
 * @param {object} req
 * @return {Promise<object>}
 */
async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Missing authorization token");
  }

  const token = authHeader.slice("Bearer ".length);
  return admin.auth().verifyIdToken(token);
}

/**
 * Loads or creates the Stripe customer for the authenticated Firebase user.
 * @param {object} params
 * @param {object} params.stripeClient
 * @param {object} params.authUser
 * @return {Promise<object>}
 */
async function getOrCreateStripeCustomer({stripeClient, authUser}) {
  const userRef = getUsersCollection().doc(authUser.uid);
  const userSnap = await userRef.get();
  const storedCustomerId = userSnap.exists ?
    userSnap.data().stripeCustomerId :
    null;

  if (storedCustomerId) {
    try {
      const existingCustomer =
        await stripeClient.customers.retrieve(storedCustomerId);

      if (!existingCustomer.deleted) {
        return existingCustomer;
      }
    } catch (error) {
      console.warn("Stored Stripe customer could not be retrieved:", error);
    }
  }

  if (authUser.email) {
    const matchingCustomers = await stripeClient.customers.list({
      email: authUser.email,
      limit: 1,
    });

    if (matchingCustomers.data.length > 0) {
      let matchedCustomer = matchingCustomers.data[0];

      if (
        getObjectMetadataValue(matchedCustomer, "firebaseUID") !== authUser.uid
      ) {
        matchedCustomer = await stripeClient.customers.update(
            matchedCustomer.id,
            {
              metadata: {
                ...matchedCustomer.metadata,
                firebaseUID: authUser.uid,
              },
            },
        );
      }

      await userRef.set({
        stripeCustomerId: matchedCustomer.id,
      }, {merge: true});

      return matchedCustomer;
    }
  }

  const customer = await stripeClient.customers.create({
    email: authUser.email,
    name: authUser.name,
    metadata: {
      firebaseUID: authUser.uid,
    },
  });

  await userRef.set({
    stripeCustomerId: customer.id,
  }, {merge: true});

  return customer;
}

/**
 * Cloud Function: Create Checkout Session
 * Handles POST requests to create a Stripe checkout session
 */
exports.createCheckoutSession = functions.https.onRequest(
    {invoker: "public", secrets: [stripeSecretKeyParam]},
    async (req, res) => {
      // Enable CORS
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization",
      );

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      try {
        const authUser = await getAuthenticatedUser(req);
        const secretKey = getRequiredSecretValue(
            stripeSecretKeyParam,
            "STRIPE_SECRET_KEY",
        );
        const stripeClient = stripe(secretKey);

        const {lookupKey} = req.body;

        if (!lookupKey) {
          return res.status(400).json({error: "Missing lookupKey"});
        }

        // Fetch the price based on lookupKey
        const prices = await stripeClient.prices.list({
          lookup_keys: [lookupKey],
        });

        if (prices.data.length === 0) {
          return res.status(404).json({error: "Price not found"});
        }

        const customer = await getOrCreateStripeCustomer({
          stripeClient,
          authUser,
        });

        const checkoutSession = await stripeClient.checkout.sessions.create({
          mode: "subscription",
          customer: customer.id,
          line_items: [
            {price: prices.data[0].id, quantity: 1},
          ],
          client_reference_id: authUser.uid,
          success_url:
            `${CHECKOUT_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: CHECKOUT_CANCEL_URL,
          metadata: {
            firebaseUID: authUser.uid,
            lookupKey,
          },
          subscription_data: {
            metadata: {
              firebaseUID: authUser.uid,
              lookupKey,
            },
          },
        });

        if (!checkoutSession.url) {
          throw new Error("Stripe did not return a Checkout URL");
        }

        return res.json({
          mode: "checkout",
          checkoutUrl: checkoutSession.url,
          customerId: customer.id,
          sessionId: checkoutSession.id,
        });
      } catch (error) {
        console.error("Checkout error:", error);
        const statusCode = error.message === "Missing authorization token" ||
          hasAuthErrorCode(error) ?
          401 :
          500;
        return res.status(statusCode).json({error: error.message});
      }
    },
);

/**
 * Cloud Function: Verify Checkout Session
 * Confirms the Checkout Session belongs to the authenticated user and syncs
 * the resulting subscription state into Firestore.
 */
exports.verifyCheckoutSession = functions.https.onRequest(
    {invoker: "public", secrets: [stripeSecretKeyParam]},
    async (req, res) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization",
      );

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      try {
        const authUser = await getAuthenticatedUser(req);
        const secretKey = getRequiredSecretValue(
            stripeSecretKeyParam,
            "STRIPE_SECRET_KEY",
        );
        const stripeClient = stripe(secretKey);
        const {sessionId} = req.body;

        if (!sessionId) {
          return res.status(400).json({error: "Missing sessionId"});
        }

        const checkoutSession = await stripeClient.checkout.sessions.retrieve(
            sessionId,
            {expand: ["subscription"]},
        );

        if (checkoutSession.mode !== "subscription") {
          return res.status(400).json({
            error: "Checkout session is not a subscription session",
          });
        }

        const resolvedFirebaseUID = checkoutSession.client_reference_id ||
          getObjectMetadataValue(checkoutSession, "firebaseUID") ||
          getObjectMetadataValue(checkoutSession.subscription, "firebaseUID") ||
          await resolveFirebaseUidForCustomer({
            stripeClient,
            customerId: checkoutSession.customer,
          });

        if (resolvedFirebaseUID !== authUser.uid) {
          return res.status(403).json({
            error: "Checkout session does not belong to this user",
          });
        }

        if (checkoutSession.status !== "complete") {
          return res.status(409).json({
            error: "Checkout session has not completed yet",
          });
        }

        if (!["paid", "no_payment_required"].includes(
            checkoutSession.payment_status,
        )) {
          return res.status(409).json({
            error: "Checkout session payment is not complete yet",
          });
        }

        if (!checkoutSession.subscription) {
          return res.status(400).json({
            error: "Checkout session did not create a subscription",
          });
        }

        const syncResult = await syncStripeSubscriptionToFirestore({
          stripeClient,
          subscription: checkoutSession.subscription,
          fallbackFirebaseUID: authUser.uid,
        });

        return res.json({
          verified: true,
          sessionId: checkoutSession.id,
          ...syncResult,
        });
      } catch (error) {
        console.error("Checkout verification error:", error);
        const statusCode = error.message === "Missing authorization token" ||
          hasAuthErrorCode(error) ?
          401 :
          500;
        return res.status(statusCode).json({error: error.message});
      }
    },
);

/**
 * Cloud Function: Create Portal Session
 * Handles POST requests to create a Stripe billing portal session
 */
exports.createPortalSession = functions.https.onRequest(
    {invoker: "public", secrets: [stripeSecretKeyParam]},
    async (req, res) => {
      // Enable CORS
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization",
      );

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      try {
        const authUser = await getAuthenticatedUser(req);
        const secretKey = getRequiredSecretValue(
            stripeSecretKeyParam,
            "STRIPE_SECRET_KEY",
        );
        const stripeClient = stripe(secretKey);

        const {sessionId, customerId} = req.body;
        const userRef = getUsersCollection().doc(authUser.uid);
        const userSnap = await userRef.get();
        const storedCustomerId = userSnap.exists ?
          userSnap.data().stripeCustomerId :
          null;

        let resolvedCustomerId = customerId || storedCustomerId;

        if (!resolvedCustomerId && sessionId) {
          const checkoutSession =
            await stripeClient.checkout.sessions.retrieve(sessionId);
          resolvedCustomerId = checkoutSession.customer;
        }

        if (!resolvedCustomerId) {
          return res.status(400).json({
            error: "Missing customer identifier for billing portal",
          });
        }

        if (storedCustomerId && resolvedCustomerId !== storedCustomerId) {
          return res.status(403).json({error: "Customer does not match user"});
        }

        // Create billing portal session
        const portalSession =
          await stripeClient.billingPortal.sessions.create({
            customer: resolvedCustomerId,
            return_url: BILLING_PORTAL_RETURN_URL,
          });

        return res.json({url: portalSession.url});
      } catch (error) {
        console.error("Portal error:", error);
        const statusCode = error.message === "Missing authorization token" ||
          hasAuthErrorCode(error) ?
          401 :
          500;
        return res.status(statusCode).json({error: error.message});
      }
    },
);

/**
 * Cloud Function: Stripe Webhook Handler
 * Handles webhook events from Stripe
 * Not implemented fully - extend as needed
 */
exports.stripeWebhook = functions.https.onRequest(
    {
      invoker: "public",
      secrets: [stripeSecretKeyParam, stripeWebhookSecretParam],
    },
    async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      try {
        const secretKey = getRequiredSecretValue(
            stripeSecretKeyParam,
            "STRIPE_SECRET_KEY",
        );
        const stripeClient = stripe(secretKey);
        const endpointSecret = getRequiredSecretValue(
            stripeWebhookSecretParam,
            "STRIPE_WEBHOOK_SECRET",
        );

        // Verify the webhook signature
        const signature = req.headers["stripe-signature"];
        let event;

        try {
          event = stripeClient.webhooks.constructEvent(
              req.rawBody || req.body,
              signature,
              endpointSecret,
          );
        } catch (err) {
          console.log(
              `Webhook signature verification failed: ${err.message}`,
          );
          return res
              .status(400)
              .send(`Webhook Error: ${err.message}`);
        }

        // Handle the event
        switch (event.type) {
          case "checkout.session.completed":
            if (
              event.data.object.mode === "subscription" &&
              event.data.object.subscription
            ) {
              await syncStripeSubscriptionToFirestore({
                stripeClient,
                subscription: event.data.object.subscription,
                fallbackFirebaseUID:
                  event.data.object.client_reference_id ||
                  getObjectMetadataValue(event.data.object, "firebaseUID"),
              });
            }
            break;
          case "customer.subscription.created":
            console.log("Subscription created:", event.data.object);
            await syncStripeSubscriptionToFirestore({
              stripeClient,
              subscription: event.data.object,
            });
            break;
          case "customer.subscription.updated":
            console.log("Subscription updated:", event.data.object);
            await syncStripeSubscriptionToFirestore({
              stripeClient,
              subscription: event.data.object,
            });
            break;
          case "customer.subscription.deleted":
            console.log("Subscription deleted:", event.data.object);
            await syncStripeSubscriptionToFirestore({
              stripeClient,
              subscription: event.data.object,
            });
            break;
          case "invoice.paid":
            console.log("Invoice paid:", event.data.object.id);
            await syncStripeInvoiceToFirestore({
              stripeClient,
              invoice: event.data.object,
            });
            break;
          case "invoice.payment_failed":
            console.log("Invoice payment failed:", event.data.object.id);
            await syncStripeInvoiceToFirestore({
              stripeClient,
              invoice: event.data.object,
            });
            break;
          case "customer.subscription.trial_will_end":
            console.log(
                "Subscription trial ending:",
                event.data.object,
            );
            // TODO: Send trial ending notification
            break;
          default:
            console.log(`Unhandled event type: ${event.type}`);
        }

        return res.json({received: true});
      } catch (error) {
        console.error("Webhook error:", error);
        return res.status(500).json({error: error.message});
      }
    },
);

/**
 * Cloud Function: Generate Training Plan
 * Uses OpenAI API to generate a personalized training plan based on user inputs
 * Server-side to protect API key and handle rate limiting
 */
exports.generateTrainingPlan = functions.https.onCall(
    {secrets: [openAiApiKeyParam]},
    async (request) => {
      try {
        if (!request.auth) {
          throw new functions.https.HttpsError(
              "unauthenticated",
              "You must be signed in to generate a training plan.",
          );
        }

        const openaiKey = getRequiredSecretValue(
            openAiApiKeyParam,
            "OPENAI_API_KEY",
        );
        const fetch = require("node-fetch");
        const data = request.data || {};
        const hasCustomMessages =
          Array.isArray(data.messages) && data.messages.length > 0;
        const messages = hasCustomMessages ?
          data.messages :
          buildOpenAiMessagesFromData(data);
        const model = typeof data.model === "string" && data.model ?
          data.model :
          "gpt-4o-mini";
        const temperature = typeof data.temperature === "number" ?
          data.temperature :
          0.7;

        // Call OpenAI API
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature,
            messages,
            response_format: {type: "json_object"},
          }),
        });

        const result = await response.json();

        if (result.error) {
          console.error("OpenAI API error:", result.error);
          throw new Error(
              `OpenAI API Error: ${result.error.message}`,
          );
        }

        const choices = result.choices || [];
        const message = choices[0] && choices[0].message;
        const content = message && message.content;
        if (!content) {
          throw new Error("No content in API response");
        }

        const plan = JSON.parse(content);
        console.log("Successfully generated training plan");
        return {success: true, plan};
      } catch (error) {
        console.error("Error generating training plan:", error);
        throw new functions.https.HttpsError(
            "internal",
            `Failed to generate training plan: ${error.message}`,
        );
      }
    },
);

/**
 * @param {object} data
 * @return {Array<object>}
 */
function buildOpenAiMessagesFromData(data) {
  const {
    goal,
    experience,
    daysPerWeek,
    weightClass,
    primaryStyle,
    competitionPeriod,
    equipment,
    injuries,
    preferences,
    primaryCombatSport,
    focusEmphasis,
    numWeeks,
    trainingPlanBatch,
  } = data;

  const prompt = buildTrainingPlanPrompt({
    goal,
    experience,
    daysPerWeek,
    weightClass,
    primaryStyle,
    competitionPeriod,
    equipment,
    injuries,
    preferences,
    primaryCombatSport,
    focusEmphasis,
    numWeeks,
    trainingPlanBatch,
  });

  return [
    {
      role: "system",
      content: prompt,
    },
  ];
}

/**
 * Builds a training plan prompt following the same structure
 * as client-side generatePlan.js
 * @param {object} userInput - User input for training plan
 * @return {string} - The complete prompt string
 */
function buildTrainingPlanPrompt(userInput) {
  const numWeeks = userInput.numWeeks || 4;
  const batch = userInput.trainingPlanBatch || 1;
  const startingWeek = (batch - 1) * 8 + 1;

  let batchContext = "";
  if (batch > 1) {
    const endWeek = startingWeek + numWeeks - 1;
    batchContext = `\nThis is BATCH ${batch} of the training plan. ` +
      `Weeks ${startingWeek}-${endWeek} are being generated. ` +
      "Progress from the previous batch and increase difficulty/" +
      "complexity accordingly.";
  }

  const prompt = `
You are **PowerTrainingCoach**, an expert AI specializing in creating safe,
effective, and personalized strength & conditioning training programs for
combat athletes.

Follow these domain rules:
- Periodization should follow block periodization for combat athletes
- Include both combat-specific (technical/sparring) and
  strength/conditioning work
- Account for recovery and injury prevention
- Scale volume and intensity based on competition period
- Consider equipment access and injuries/weaknesses
- Ensure progressive overload across the training cycle
- Always respect the athlete's experience level
- **CRITICAL: ALWAYS include EXACTLY ${userInput.daysPerWeek} training days**
  **per week. No more, no less.**
- **CRITICAL: Every exercise MUST have a videoUrl pointing to a**
  **real YouTube tutorial video for that exact exercise.**

Adapt the plan to:
- primary combat sport and style focus (striking/grappling/balanced)
- weight class (manage volume/intensity for the class)
- upcoming competition period (off-season, pre-season, fight camp,
  in-season)
- equipment access (full gym vs minimal/home)
- injuries and weaknesses (avoid aggravating, include prehab where sensible)
- focus emphasis (more sparring/technique vs more conditioning)
- requested weekly frequency (${userInput.daysPerWeek} days per week)
${batchContext}

---

### USER INPUT (JSON):
${JSON.stringify(userInput, null, 2)}

---

### OUTPUT INSTRUCTIONS:
- Respond ONLY in valid JSON.
- Follow the structure below EXACTLY.
- Do not include commentary or explanation.
- Week numbers should start at ${startingWeek}
- **IMPORTANT: Each week MUST have EXACTLY ${userInput.daysPerWeek} days**
  **in the days array.**
- **IMPORTANT: Every exercise MUST include a videoUrl with a real**
  **YouTube URL for an instructional video of that exercise.**

{
  "summary": "Brief description of this training phase (batch ${batch})",
  "weeks": [
    {
      "week": ${startingWeek},
      "days": [
        {
          "day": 1,
          "exercises": [
            {
              "name": "Exercise Name",
              "sets": "3–5",
              "reps": "8–12",
              "notes": "Short instruction or coaching cue",
              "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
            }
          ]
        }
      ]
    }
  ]
}

---

Now generate the training plan JSON with ${numWeeks} weeks total.
**CRITICAL: Each week must include EXACTLY ${userInput.daysPerWeek}**
**training days (${userInput.daysPerWeek} days objects in the "days" array).**
**CRITICAL: Every exercise MUST have a valid videoUrl field with a real**
**YouTube URL (https://www.youtube.com/watch?v=...) for that exercise.**
Start week numbering at ${startingWeek}.
Follow periodization principles for ${numWeeks} weeks of training.
`;

  return prompt;
}
