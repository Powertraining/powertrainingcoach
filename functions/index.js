// Firebase Cloud Functions for Stripe Payment Processing
// All sensitive API keys are managed server-side via Firebase Admin SDK

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe");

// Initialize Firebase Admin
admin.initializeApp();

const YOUR_DOMAIN = "https://powertrainingcoach.web.app";

/**
 * Fetches the Stripe secret key from Firestore
 * @return {Promise<string>} The Stripe secret API key
 */
async function getStripeSecretKey() {
  try {
    const db = admin.firestore();
    const docRef = db.collection("config").doc("secrets");
    const docSnap = await docRef.get();

    if (docSnap.exists && docSnap.data().stripe_key) {
      return docSnap.data().stripe_key;
    } else {
      throw new Error("Stripe API key not found in Firestore");
    }
  } catch (error) {
    console.error("Error fetching Stripe key:", error);
    throw error;
  }
}

/**
 * Cloud Function: Create Checkout Session
 * Handles POST requests to create a Stripe checkout session
 */
exports.createCheckoutSession = functions.https.onRequest(
    async (req, res) => {
      // Enable CORS
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      try {
        const secretKey = await getStripeSecretKey();
        const stripeClient = stripe(secretKey);

        const {lookupKey} = req.body;

        if (!lookupKey) {
          return res.status(400).json({error: "Missing lookupKey"});
        }

        // Fetch the price based on lookupKey
        const prices = await stripeClient.prices.list({
          lookup_keys: [lookupKey],
          expand: ["data.product"],
        });

        if (prices.data.length === 0) {
          return res.status(404).json({error: "Price not found"});
        }

        // Create checkout session with promotion code support
        const session = await stripeClient.checkout.sessions.create({
          billing_address_collection: "auto",
          line_items: [
            {
              price: prices.data[0].id,
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${YOUR_DOMAIN}/#/subscription?success=true` +
              "&session_id={CHECKOUT_SESSION_ID}",
          cancel_url: `${YOUR_DOMAIN}/#/subscription?canceled=true`,
          allow_promotion_codes: true,
        });

        return res.json({url: session.url});
      } catch (error) {
        console.error("Checkout error:", error);
        return res.status(500).json({error: error.message});
      }
    },
);

/**
 * Cloud Function: Create Portal Session
 * Handles POST requests to create a Stripe billing portal session
 */
exports.createPortalSession = functions.https.onRequest(
    async (req, res) => {
      // Enable CORS
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      try {
        const secretKey = await getStripeSecretKey();
        const stripeClient = stripe(secretKey);

        const {sessionId} = req.body;

        if (!sessionId) {
          return res.status(400).json({error: "Missing sessionId"});
        }

        // Retrieve the checkout session to get the customer ID
        const checkoutSession =
                await stripeClient.checkout.sessions.retrieve(sessionId);

        if (!checkoutSession.customer) {
          return res
              .status(400)
              .json({error: "No customer associated with session"});
        }

        // Create billing portal session
        const portalSession =
                await stripeClient.billingPortal.sessions.create({
                  customer: checkoutSession.customer,
                  return_url: `${YOUR_DOMAIN}/#subscription`,
                });

        return res.json({url: portalSession.url});
      } catch (error) {
        console.error("Portal error:", error);
        return res.status(500).json({error: error.message});
      }
    },
);

/**
 * Cloud Function: Stripe Webhook Handler
 * Handles webhook events from Stripe
 * Not implemented fully - extend as needed
 */
exports.stripeWebhook = functions.https.onRequest(
    async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      try {
        const secretKey = await getStripeSecretKey();
        const stripeClient = stripe(secretKey);

        // Get the webhook signing secret from Firestore
        const db = admin.firestore();
        const docRef = db.collection("config").doc("secrets");
        const docSnap = await docRef.get();
        const endpointSecret = docSnap.data().stripe_webhook_secret;

        if (!endpointSecret) {
          console.warn("Webhook endpoint secret not configured");
          return res
              .status(400)
              .json({error: "Webhook not configured"});
        }

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
          case "customer.subscription.created":
            console.log("Subscription created:", event.data.object);
            // TODO: Handle subscription created
            break;
          case "customer.subscription.updated":
            console.log("Subscription updated:", event.data.object);
            // TODO: Handle subscription updated
            break;
          case "customer.subscription.deleted":
            console.log("Subscription deleted:", event.data.object);
            // TODO: Handle subscription deleted
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
 * Fetches the OpenAI API key from Firestore
 * @return {Promise<string>} The OpenAI API key
 */
async function getOpenAIKey() {
  try {
    const db = admin.firestore();
    const docRef = db.collection("config").doc("secrets");
    const docSnap = await docRef.get();

    if (docSnap.exists && docSnap.data().openai_key) {
      return docSnap.data().openai_key;
    } else {
      throw new Error("OpenAI API key not found in Firestore");
    }
  } catch (error) {
    console.error("Error fetching OpenAI key:", error);
    throw error;
  }
}

/**
 * Cloud Function: Generate Training Plan
 * Uses OpenAI API to generate a personalized training plan based on user inputs
 * Server-side to protect API key and handle rate limiting
 */
exports.generateTrainingPlan = functions.https.onCall(
    async (data, context) => {
      try {
        const openaiKey = await getOpenAIKey();
        const fetch = require("node-fetch");

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

        // Build a structured prompt similar to the client-side version
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

        // Call OpenAI API
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.7,
            messages: [
              {
                role: "system",
                content: prompt,
              },
            ],
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


