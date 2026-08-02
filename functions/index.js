// Firebase Cloud Functions for Stripe Payment Processing
// Stripe secrets are managed via Firebase Secret Manager

const functions = require("firebase-functions");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const {getFirestore} = require("firebase-admin/firestore");
const stripe = require("stripe");
const {
  BOOKING_STATUS,
  CONSULTATION_BOOKING_COLLECTION,
  CONSULTATION_SLOT_COLLECTION,
  DEFAULT_BOOKING_WINDOW_DAYS,
  DEFAULT_CANCELLATION_WINDOW_HOURS,
  DEFAULT_CHECKOUT_HOLD_MINUTES,
  DEFAULT_CURRENCY,
  NEXT_ACTION,
  PAYMENT_STATUS,
  SLOT_STATUS,
  assertValidSlotWindow,
  buildConsultationPolicy,
  calculateCheckoutExpiryMs,
  calculateRefundableUntilMs,
  hasIntervalOverlap,
  normalizeCurrency,
  parseIsoDate,
  parsePositiveInteger,
  timeValueToMs,
} = require("./consultationBooking");
const {
  normalizeBoundedString,
  normalizeEnumValue,
  normalizeFirestoreDocumentId,
  normalizeInteger,
  normalizeSafeReturnToPath,
  normalizeStripeCheckoutSessionId,
  requirePlainObject,
} = require("./inputValidation");
const {
  appendCheckoutSessionTemplate,
  appendQueryParams,
} = require("./stripeCheckoutUrls");
const {sanitizeExerciseOption} = require("./trainingPlanValidation");

// Initialize Firebase Admin
admin.initializeApp();

const FIREBASE_PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.GCP_PROJECT ||
  admin.app().options.projectId ||
  "power-training-coach";
const CONFIGURED_FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID;
const HOSTING_BASE_URL =
  process.env.HOSTING_BASE_URL || `https://${FIREBASE_PROJECT_ID}.web.app`;
const USER_COLLECTION = "users";
const COMBAT_MODEL_COLLECTION = "combatModel";
const PLAN_REGENERATION_MONTHLY_LIMIT = 3;
const PROFILE_RESET_CONFIRMATION = "RESET_PROFILE";
const CHECKOUT_SUCCESS_URL =
  `${HOSTING_BASE_URL}/checkout_redirect/success.html`;
const CHECKOUT_CANCEL_URL =
  `${HOSTING_BASE_URL}/checkout_redirect/cancel.html`;
const BILLING_PORTAL_RETURN_URL =
  `${HOSTING_BASE_URL}/checkout_redirect/portal.html`;
const stripeSecretKeyParam = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecretParam = defineSecret("STRIPE_WEBHOOK_SECRET");
const openAiApiKeyParam = defineSecret("OPENAI_API_KEY");
const SUBSCRIPTION_TRIAL_DAYS = parsePositiveInteger(
    process.env.SUBSCRIPTION_TRIAL_DAYS,
    7,
);
const SUBSCRIPTION_PLAN_CONFIGS = Object.freeze([
  {
    subscriptionType: "starter",
    lookupKey: "starter_plan_setup",
    fallbackName: "Starter Plan",
  },
  {
    subscriptionType: "pro",
    lookupKey: "pro_plan_setup",
    fallbackName: "Pro Plan",
  },
  {
    subscriptionType: "expert",
    lookupKey: "expert_plan_setup",
    fallbackName: "Expert Plan",
  },
]);
const CONSULTATION_CHECKOUT_HOLD_MINUTES = parsePositiveInteger(
    process.env.CONSULTATION_CHECKOUT_HOLD_MINUTES,
    DEFAULT_CHECKOUT_HOLD_MINUTES,
);
const CONSULTATION_CANCELLATION_WINDOW_HOURS = parsePositiveInteger(
    process.env.CONSULTATION_CANCELLATION_WINDOW_HOURS,
    DEFAULT_CANCELLATION_WINDOW_HOURS,
);
const CONSULTATION_MAX_BOOKING_WINDOW_DAYS = parsePositiveInteger(
    process.env.CONSULTATION_MAX_BOOKING_WINDOW_DAYS,
    DEFAULT_BOOKING_WINDOW_DAYS,
);
const CONSULTATION_DEFAULT_CURRENCY = normalizeCurrency(
    process.env.CONSULTATION_DEFAULT_CURRENCY,
    DEFAULT_CURRENCY,
);

/**
 * @return {string}
 */
function getResolvedFirestoreDatabaseId() {
  if (
    !CONFIGURED_FIRESTORE_DATABASE_ID ||
    CONFIGURED_FIRESTORE_DATABASE_ID === "(default)"
  ) {
    return "(default)";
  }

  return CONFIGURED_FIRESTORE_DATABASE_ID;
}

/**
 * @return {FirebaseFirestore.Firestore}
 */
function getFirestoreDb() {
  const databaseId = getResolvedFirestoreDatabaseId();

  if (databaseId === "(default)") {
    return getFirestore(admin.app());
  }

  return getFirestore(admin.app(), databaseId);
}

/**
 * @return {FirebaseFirestore.CollectionReference}
 */
function getUsersCollection() {
  return getFirestoreDb().collection(USER_COLLECTION);
}

/**
 * @return {FirebaseFirestore.CollectionReference}
 */
function getCombatModelCollection() {
  return getFirestoreDb().collection(COMBAT_MODEL_COLLECTION);
}

/**
 * Returns a clean app-data document for a profile reset.
 * Authentication and identity live outside this document.
 * @return {object}
 */
function createResetCombatModelData() {
  return {
    questionnaire: {},
    primaryCombatSport: "",
    sessionsPerWeek: 3,
    trainingPlan: null,
    trainingPlanHistory: [],
    completedDays: [],
    trainingPlanBatch: 1,
    completedWeeks: 0,
    subscription: false,
    subscriptionEndDate: null,
    subscriptionStartDate: null,
    subscriptionType: "",
    subscriptionStatus: "",
    stripePriceLookupKey: "",
    stripeSubscriptionId: null,
    stripeCustomerId: null,
    billingProvider: "",
    planRegenerationUsage: null,
    trainingPerformanceState: {sessions: {}},
    strengthAssessmentState: {lifts: {}, sessions: {}},
    trainingCheckInState: {},
    activeSessionProgressByKey: {},
    completedSessionProgressByKey: {},
    forumProfile: {
      followedUserIds: [],
      likedPostIds: [],
      savedPostIds: [],
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

/**
 * @return {string}
 */
function getCurrentPlanRegenerationMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

/**
 * @param {string} userId
 * @return {Promise<object>}
 */
async function reservePlanRegeneration(userId) {
  const firestore = getFirestoreDb();
  const documentRef = getCombatModelCollection().doc(userId);
  const monthKey = getCurrentPlanRegenerationMonthKey();

  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(documentRef);
    const storedUsage = snapshot.exists ?
      snapshot.data().planRegenerationUsage || {} :
      {};
    const subscriptionStatus = snapshot.exists ?
      snapshot.data().subscriptionStatus || "" :
      "";

    if (subscriptionStatus === "trialing") {
      throw new functions.https.HttpsError(
          "permission-denied",
          "Plan regeneration is not available during the free trial.",
      );
    }
    const used = storedUsage.monthKey === monthKey ?
      Math.max(0, Number.parseInt(storedUsage.used, 10) || 0) :
      0;

    if (used >= PLAN_REGENERATION_MONTHLY_LIMIT) {
      throw new functions.https.HttpsError(
          "resource-exhausted",
          "You have used all plan regenerations for this month.",
      );
    }

    const nextUsed = used + 1;
    transaction.set(documentRef, {
      planRegenerationUsage: {
        monthKey,
        used: nextUsed,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    }, {merge: true});

    return {
      monthKey,
      used: nextUsed,
      limit: PLAN_REGENERATION_MONTHLY_LIMIT,
      remaining: PLAN_REGENERATION_MONTHLY_LIMIT - nextUsed,
    };
  });
}

/**
 * Refunds a reservation when generation fails.
 * @param {string} userId
 * @param {string} monthKey
 * @return {Promise<void>}
 */
async function refundPlanRegeneration(userId, monthKey) {
  const firestore = getFirestoreDb();
  const documentRef = getCombatModelCollection().doc(userId);

  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(documentRef);
    const storedUsage = snapshot.exists ?
      snapshot.data().planRegenerationUsage || {} :
      {};

    if (storedUsage.monthKey !== monthKey) {
      return;
    }

    const used = Math.max(0, Number.parseInt(storedUsage.used, 10) || 0);
    transaction.set(documentRef, {
      planRegenerationUsage: {
        monthKey,
        used: Math.max(0, used - 1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    }, {merge: true});
  });
}

/**
 * @return {FirebaseFirestore.CollectionReference}
 */
function getConsultationSlotCollection() {
  return getFirestoreDb().collection(CONSULTATION_SLOT_COLLECTION);
}

/**
 * @return {FirebaseFirestore.CollectionReference}
 */
function getConsultationBookingCollection() {
  return getFirestoreDb().collection(CONSULTATION_BOOKING_COLLECTION);
}

/**
 * @param {object} res
 */
function setCorsHeaders(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
  );
}

/**
 * @param {string} message
 * @param {number} statusCode
 * @return {Error}
 */
function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * @param {Error|object} error
 * @return {number}
 */
function getHttpStatusCode(error) {
  if (error && typeof error.statusCode === "number") {
    return error.statusCode;
  }

  if (error && error.message === "Missing authorization token") {
    return 401;
  }

  if (hasAuthErrorCode(error)) {
    return 401;
  }

  return 500;
}

/**
 * @return {object}
 */
function getConsultationPolicy() {
  return buildConsultationPolicy({
    cancellationWindowHours: CONSULTATION_CANCELLATION_WINDOW_HOURS,
    checkoutHoldMinutes: CONSULTATION_CHECKOUT_HOLD_MINUTES,
    maxBookingWindowDays: CONSULTATION_MAX_BOOKING_WINDOW_DAYS,
  });
}

/**
 * @param {*} value
 * @return {string|null}
 */
function serializeTimestamp(value) {
  const valueMs = timeValueToMs(value);

  if (!valueMs) {
    return null;
  }

  return new Date(valueMs).toISOString();
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
 * @return {number|null}
 */
function getSubscriptionPeriodEndUnixTimestamp(subscription) {
  if (!subscription) {
    return null;
  }

  if (typeof subscription.current_period_end === "number") {
    return subscription.current_period_end;
  }

  const itemPeriodEnds = ((subscription.items && subscription.items.data) || [])
      .map((item) => item && typeof item.current_period_end === "number" ?
        item.current_period_end :
        null)
      .filter((value) => typeof value === "number");

  if (itemPeriodEnds.length > 0) {
    return Math.max(...itemPeriodEnds);
  }

  return null;
}

/**
 * @param {object} subscription
 * @return {number|null}
 */
function getSubscriptionPeriodStartUnixTimestamp(subscription) {
  if (!subscription) {
    return null;
  }

  if (typeof subscription.current_period_start === "number") {
    return subscription.current_period_start;
  }

  const itemPeriodStarts = (
    (subscription.items && subscription.items.data) || []
  )
      .map((item) => item && typeof item.current_period_start === "number" ?
        item.current_period_start :
        null)
      .filter((value) => typeof value === "number");

  if (itemPeriodStarts.length > 0) {
    return Math.min(...itemPeriodStarts);
  }

  if (typeof subscription.start_date === "number") {
    return subscription.start_date;
  }

  if (typeof subscription.created === "number") {
    return subscription.created;
  }

  return null;
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

  const subscriptionPeriodEnd = getSubscriptionPeriodEndUnixTimestamp(
      subscription,
  );

  if (!subscriptionPeriodEnd) {
    return false;
  }

  return subscriptionPeriodEnd * 1000 > Date.now();
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
 * @param {Error|object} error
 * @return {boolean}
 */
function isFirestoreDatabaseNotFoundError(error) {
  return Boolean(error && error.code === 5);
}

/**
 * @param {Error|object} error
 * @return {string}
 */
function getClientSafeErrorMessage(error) {
  if (isFirestoreDatabaseNotFoundError(error)) {
    return (
      `Firestore database ${getResolvedFirestoreDatabaseId()} was not found ` +
      `in project ${FIREBASE_PROJECT_ID}. Create that database in Firebase ` +
      "or set FIRESTORE_DATABASE_ID for Functions to the correct database ID."
    );
  }

  return error && error.message ? error.message : "Unexpected server error";
}

/**
 * @param {*} returnTo
 * @return {string}
 */
function getSafeReturnToPath(returnTo) {
  return normalizeSafeReturnToPath(returnTo);
}

/**
 * @param {object} req
 * @return {object}
 */
function getValidatedRequestBody(req) {
  return requirePlainObject(req.body || {}, "request body");
}

/**
 * @return {Set<string>}
 */
function getAllowedSubscriptionLookupKeys() {
  return new Set(SUBSCRIPTION_PLAN_CONFIGS.map((config) => config.lookupKey));
}

/**
 * @param {*} value
 * @return {string}
 */
function normalizeSubscriptionLookupKey(value) {
  return normalizeEnumValue(
      value,
      getAllowedSubscriptionLookupKeys(),
      "lookupKey",
  );
}

/**
 * @param {*} value
 * @return {boolean}
 */
function normalizeBooleanFlag(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === "true") {
      return true;
    }

    if (normalizedValue === "false") {
      return false;
    }
  }

  return Boolean(value);
}

/**
 * @param {string} currency
 * @return {number}
 */
function getCurrencyFractionDigits(currency) {
  const normalizedCurrency = normalizeCurrency(
      currency,
      DEFAULT_CURRENCY,
  ).toUpperCase();

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
    }).resolvedOptions().maximumFractionDigits;
  } catch (error) {
    console.warn(
        `Could not determine currency digits for ${normalizedCurrency}:`,
        error,
    );
    return 2;
  }
}

/**
 * @param {number|null} amountMinor
 * @param {string} currency
 * @return {string}
 */
function formatStripeAmount(amountMinor, currency) {
  if (typeof amountMinor !== "number") {
    return "";
  }

  const normalizedCurrency = normalizeCurrency(
      currency,
      DEFAULT_CURRENCY,
  ).toUpperCase();
  const fractionDigits = getCurrencyFractionDigits(normalizedCurrency);
  const amountMajor = amountMinor / Math.pow(10, fractionDigits);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizedCurrency,
    currencyDisplay: "code",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amountMajor).replace(/\s+/g, " ").trim();
}

/**
 * @param {object|null} recurring
 * @return {string}
 */
function formatStripeRecurringInterval(recurring) {
  if (!recurring || !recurring.interval) {
    return "";
  }

  const intervalCount = recurring.interval_count || 1;

  if (intervalCount === 1) {
    return recurring.interval;
  }

  return `${intervalCount} ${recurring.interval}s`;
}

/**
 * @param {object} price
 * @return {string}
 */
function formatStripePriceLabel(price) {
  const amountLabel = formatStripeAmount(price.unit_amount, price.currency);

  if (!amountLabel) {
    return "";
  }

  const recurringInterval = formatStripeRecurringInterval(price.recurring);

  if (!recurringInterval) {
    return amountLabel;
  }

  return `${amountLabel} / ${recurringInterval}`;
}

/**
 * @param {object} price
 * @param {string} fallbackName
 * @return {object}
 */
function serializeSubscriptionPlan(price, fallbackName) {
  const recurring = price.recurring || null;
  const product =
    price.product &&
    typeof price.product === "object" &&
    !price.product.deleted ?
      price.product :
      null;

  return {
    lookupKey: price.lookup_key || null,
    priceId: price.id,
    name: product && product.name ? product.name : fallbackName,
    description: product && product.description ? product.description : "",
    currency: normalizeCurrency(price.currency, DEFAULT_CURRENCY).toUpperCase(),
    unitAmount:
      typeof price.unit_amount === "number" ? price.unit_amount : null,
    interval: recurring && recurring.interval ? recurring.interval : null,
    intervalCount:
      recurring && recurring.interval_count ? recurring.interval_count : 1,
    priceLabel: formatStripePriceLabel(price),
  };
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
  const resolvedFirebaseUID = getObjectMetadataValue(
      resolvedSubscription,
      "firebaseUID",
  ) ||
    fallbackFirebaseUID ||
    await resolveFirebaseUidForCustomer({
      stripeClient,
      customerId,
    });

  if (!resolvedFirebaseUID) {
    throw new Error("Could not resolve Firebase user for subscription");
  }

  const firebaseUID = normalizeFirestoreDocumentId(
      resolvedFirebaseUID,
      "firebaseUID",
  );

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
  const subscriptionConfig = SUBSCRIPTION_PLAN_CONFIGS.find(
      (config) => config.lookupKey === lookupKey,
  );
  const subscriptionType = subscriptionConfig ?
    subscriptionConfig.subscriptionType :
    null;
  const subscriptionPeriodEnd = getSubscriptionPeriodEndUnixTimestamp(
      resolvedSubscription,
  );
  const subscriptionEndDate = formatDateFromUnixTimestamp(
      subscriptionPeriodEnd,
  );
  const subscriptionStartDate = formatDateFromUnixTimestamp(
      getSubscriptionPeriodStartUnixTimestamp(resolvedSubscription),
  );
  const active = isSubscriptionEntitled(resolvedSubscription);

  await getCombatModelCollection().doc(firebaseUID).set({
    subscription: active,
    subscriptionEndDate,
    subscriptionStartDate,
    subscriptionType,
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
    subscriptionType,
    subscriptionEndDate,
    subscriptionStartDate,
    subscriptionId: resolvedSubscription.id,
    subscriptionStatus: resolvedSubscription.status,
  };
}

/**
 * @param {object} params
 * @param {object} params.stripeClient
 * @param {string} params.customerId
 * @return {Promise<string|null>}
 */
async function findSubscriptionIdForCustomer({stripeClient, customerId}) {
  if (!customerId) {
    return null;
  }

  const subscriptions = await stripeClient.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });

  const prioritizedSubscription = subscriptions.data.find((subscription) =>
    ["active", "trialing", "past_due", "unpaid", "paused"].includes(
        subscription.status,
    ),
  ) || subscriptions.data[0];

  return prioritizedSubscription ? prioritizedSubscription.id : null;
}

/**
 * @param {object} params
 * @param {object} params.stripeClient
 * @param {string} params.customerId
 * @return {Promise<boolean>}
 */
async function isEligibleForSubscriptionTrial({stripeClient, customerId}) {
  if (!customerId || SUBSCRIPTION_TRIAL_DAYS < 1) {
    return false;
  }

  const subscriptions = await stripeClient.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 1,
  });

  return subscriptions.data.length === 0;
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
 * Cancels billing and clears all non-identity profile data.
 * @param {object} authUser
 * @return {Promise<object>}
 */
async function resetAuthenticatedProfile(authUser) {
  const firebaseUID = normalizeFirestoreDocumentId(
      authUser.uid,
      "firebaseUID",
  );
  const combatModelRef = getCombatModelCollection().doc(firebaseUID);
  const userRef = getUsersCollection().doc(firebaseUID);
  const [combatModelSnap, userSnap] = await Promise.all([
    combatModelRef.get(),
    userRef.get(),
  ]);
  const combatModelData = combatModelSnap.exists ?
    combatModelSnap.data() : {};
  const userData = userSnap.exists ? userSnap.data() : {};
  const customerId = combatModelData.stripeCustomerId ||
    userData.stripeCustomerId || null;
  let cancelledSubscriptions = 0;

  if (customerId) {
    const secretKey = getRequiredSecretValue(
        stripeSecretKeyParam,
        "STRIPE_SECRET_KEY",
    );
    const stripeClient = stripe(secretKey);
    const subscriptions = await stripeClient.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100,
    });
    const cancellableSubscriptions = subscriptions.data.filter(
        (subscription) => ![
          "canceled",
          "incomplete_expired",
        ].includes(subscription.status),
    );

    await Promise.all(cancellableSubscriptions.map(
        (subscription) => stripeClient.subscriptions.cancel(subscription.id),
    ));
    cancelledSubscriptions = cancellableSubscriptions.length;
  }

  const preservedUserData = {
    uid: userData.uid || firebaseUID,
    email: userData.email || authUser.email || "",
    emailVerified: typeof userData.emailVerified === "boolean" ?
      userData.emailVerified : Boolean(authUser.email_verified),
    displayName: userData.displayName || authUser.name || "",
    role: userData.role || "user",
    createdAt: userData.createdAt ||
      admin.firestore.FieldValue.serverTimestamp(),
  };
  const batch = getFirestoreDb().batch();
  batch.set(combatModelRef, createResetCombatModelData());
  batch.set(userRef, preservedUserData);
  await batch.commit();

  await admin.auth().updateUser(firebaseUID, {photoURL: null});

  try {
    await admin.storage().bucket().deleteFiles({
      prefix: `profilePictures/${firebaseUID}/`,
    });
  } catch (storageError) {
    console.warn(
        `Could not remove profile pictures for ${firebaseUID}:`,
        storageError,
    );
  }

  return {
    reset: true,
    cancelledSubscriptions,
    identityPreserved: true,
  };
}

/**
 * Loads or creates the Stripe customer for the authenticated Firebase user.
 * @param {object} params
 * @param {object} params.stripeClient
 * @param {object} params.authUser
 * @return {Promise<object>}
 */
async function getOrCreateStripeCustomer({stripeClient, authUser}) {
  const firebaseUID = normalizeFirestoreDocumentId(authUser.uid, "firebaseUID");
  const userRef = getUsersCollection().doc(firebaseUID);
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
        getObjectMetadataValue(matchedCustomer, "firebaseUID") !== firebaseUID
      ) {
        matchedCustomer = await stripeClient.customers.update(
            matchedCustomer.id,
            {
              metadata: {
                ...matchedCustomer.metadata,
                firebaseUID,
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
      firebaseUID,
    },
  });

  await userRef.set({
    stripeCustomerId: customer.id,
  }, {merge: true});

  return customer;
}

/**
 * @param {object} authUser
 * @return {Promise<void>}
 */
async function assertAdminUser(authUser) {
  const firebaseUID = normalizeFirestoreDocumentId(authUser.uid, "firebaseUID");
  const userSnap = await getUsersCollection().doc(firebaseUID).get();
  const role = userSnap.exists ? userSnap.data().role : null;

  if (role !== "admin") {
    throw createHttpError("Admin access required", 403);
  }
}

/**
 * @param {object} slotData
 * @param {number} nowMs
 * @return {boolean}
 */
function isExpiredHeldConsultationSlot(slotData, nowMs) {
  const holdExpiresAtMs = timeValueToMs(slotData && slotData.holdExpiresAt);

  return Boolean(
      slotData &&
      slotData.status === SLOT_STATUS.HELD &&
      holdExpiresAtMs &&
      holdExpiresAtMs <= nowMs,
  );
}

/**
 * @param {object} slotData
 * @param {number} nowMs
 * @return {string|null}
 */
function getConsultationSlotStatusForRead(slotData, nowMs) {
  if (!slotData) {
    return null;
  }

  if (isExpiredHeldConsultationSlot(slotData, nowMs)) {
    return SLOT_STATUS.AVAILABLE;
  }

  return slotData.status || SLOT_STATUS.AVAILABLE;
}

/**
 * @param {object} slotData
 * @param {string} bookingId
 * @return {boolean}
 */
function isConsultationSlotReservedForBooking(slotData, bookingId) {
  if (!slotData || !bookingId) {
    return false;
  }

  return (
    slotData.activeBookingId === bookingId ||
    slotData.bookedBookingId === bookingId
  );
}

/**
 * @param {string} slotId
 * @param {object} slotData
 * @param {number} nowMs
 * @param {boolean=} includePrivateFields
 * @return {object}
 */
function serializeConsultationSlot(
    slotId,
    slotData,
    nowMs,
    includePrivateFields,
) {
  const serializedSlot = {
    slotId,
    title: slotData.title || "Consultation",
    description: slotData.description || "",
    coachUid: slotData.coachUid || null,
    status: getConsultationSlotStatusForRead(slotData, nowMs),
    startsAt: serializeTimestamp(slotData.startsAt),
    endsAt: serializeTimestamp(slotData.endsAt),
    timezone: slotData.timezone || "UTC",
    amount: slotData.amount || 0,
    currency: normalizeCurrency(
        slotData.currency,
        CONSULTATION_DEFAULT_CURRENCY,
    ),
    meetingType: slotData.meetingType || "video",
    location: slotData.location || "",
    bookingPolicy: getConsultationPolicy(),
    createdAt: serializeTimestamp(slotData.createdAt),
    updatedAt: serializeTimestamp(slotData.updatedAt),
  };

  if (includePrivateFields) {
    serializedSlot.activeBookingId = slotData.activeBookingId || null;
    serializedSlot.bookedBookingId = slotData.bookedBookingId || null;
    serializedSlot.holdExpiresAt = serializeTimestamp(slotData.holdExpiresAt);
  }

  return serializedSlot;
}

/**
 * @param {string} bookingId
 * @param {object} bookingData
 * @return {object}
 */
function serializeConsultationBooking(bookingId, bookingData) {
  return {
    bookingId,
    slotId: bookingData.slotId || null,
    title: bookingData.title || "Consultation",
    description: bookingData.description || "",
    coachUid: bookingData.coachUid || null,
    userUid: bookingData.userUid || null,
    bookingStatus: bookingData.bookingStatus || null,
    paymentStatus: bookingData.paymentStatus || null,
    cancellationReason: bookingData.cancellationReason || null,
    cancellationOutcome: bookingData.cancellationOutcome || null,
    startsAt: serializeTimestamp(bookingData.startsAt),
    endsAt: serializeTimestamp(bookingData.endsAt),
    timezone: bookingData.timezone || "UTC",
    amount: bookingData.amount || 0,
    currency: normalizeCurrency(
        bookingData.currency,
        CONSULTATION_DEFAULT_CURRENCY,
    ),
    refundableUntil: serializeTimestamp(bookingData.refundableUntil),
    checkoutExpiresAt: serializeTimestamp(bookingData.checkoutExpiresAt),
    nextActionAt: serializeTimestamp(bookingData.nextActionAt),
    nextActionType: bookingData.nextActionType || null,
    stripeCheckoutSessionId: bookingData.stripeCheckoutSessionId || null,
    stripePaymentIntentId: bookingData.stripePaymentIntentId || null,
    stripeRefundId: bookingData.stripeRefundId || null,
    createdAt: serializeTimestamp(bookingData.createdAt),
    updatedAt: serializeTimestamp(bookingData.updatedAt),
    canceledAt: serializeTimestamp(bookingData.canceledAt),
    paidAt: serializeTimestamp(bookingData.paidAt),
    paymentReleasedAt: serializeTimestamp(bookingData.paymentReleasedAt),
  };
}

/**
 * @param {object} stripeClient
 * @param {string} sessionId
 * @return {Promise<object>}
 */
async function retrieveExpandedConsultationCheckoutSession(
    stripeClient,
    sessionId,
) {
  return stripeClient.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent.latest_charge"],
  });
}

/**
 * @param {object} stripeClient
 * @param {object} checkoutSession
 * @return {Promise<string|null>}
 */
async function resolveFirebaseUidForCheckoutSession(
    stripeClient,
    checkoutSession,
) {
  const customerId = typeof checkoutSession.customer === "string" ?
    checkoutSession.customer :
    (checkoutSession.customer ? checkoutSession.customer.id : null);

  return checkoutSession.client_reference_id ||
    getObjectMetadataValue(checkoutSession, "firebaseUID") ||
    await resolveFirebaseUidForCustomer({
      stripeClient,
      customerId,
    });
}

/**
 * @param {string} returnTo
 * @param {string} bookingId
 * @return {{successUrl: string, cancelUrl: string}}
 */
function buildConsultationCheckoutUrls(returnTo, bookingId) {
  const safeReturnTo = getSafeReturnToPath(returnTo);

  return {
    successUrl: appendCheckoutSessionTemplate(CHECKOUT_SUCCESS_URL, {
      return_to: safeReturnTo,
      booking_id: bookingId,
      booking_kind: "consultation",
    }),
    cancelUrl: appendQueryParams(CHECKOUT_CANCEL_URL, {
      canceled: "true",
      return_to: safeReturnTo,
      booking_id: bookingId,
      booking_kind: "consultation",
    }),
  };
}

/**
 * @param {object} stripeClient
 * @param {string} paymentIntentId
 * @return {Promise<object|null>}
 */
async function retrievePaymentIntentIfPresent(stripeClient, paymentIntentId) {
  if (!paymentIntentId) {
    return null;
  }

  return stripeClient.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });
}

/**
 * @param {object} params
 * @param {string} params.bookingId
 * @param {string|null} params.slotId
 * @param {object} params.bookingPatch
 * @param {object=} params.slotPatch
 * @return {Promise<void>}
 */
async function writeConsultationBookingAndSlot({
  bookingId,
  slotId,
  bookingPatch,
  slotPatch,
}) {
  const safeBookingId = normalizeFirestoreDocumentId(bookingId, "bookingId");
  const safeSlotId = slotId ?
    normalizeFirestoreDocumentId(slotId, "slotId") :
    null;
  const bookingRef = getConsultationBookingCollection().doc(safeBookingId);
  const slotRef = safeSlotId ?
    getConsultationSlotCollection().doc(safeSlotId) :
    null;

  await getFirestoreDb().runTransaction(async (transaction) => {
    const bookingSnap = await transaction.get(bookingRef);

    if (!bookingSnap.exists) {
      throw createHttpError("Consultation booking was not found", 404);
    }

    transaction.set(bookingRef, {
      ...bookingPatch,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

    if (slotRef && slotPatch) {
      const slotSnap = await transaction.get(slotRef);

      if (slotSnap.exists) {
        transaction.set(slotRef, {
          ...slotPatch,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, {merge: true});
      }
    }
  });
}

/**
 * @param {object} params
 * @param {object} params.stripeClient
 * @param {object|string|null} params.paymentIntent
 * @param {string} params.reason
 * @return {Promise<object>}
 */
async function releaseConsultationPaymentForFailedBooking({
  stripeClient,
  paymentIntent,
  reason,
}) {
  let resolvedPaymentIntent = paymentIntent;

  if (!resolvedPaymentIntent) {
    return {
      paymentStatus: PAYMENT_STATUS.FAILED,
      releasedPaymentIntentId: null,
      stripeRefundId: null,
    };
  }

  if (typeof resolvedPaymentIntent === "string") {
    resolvedPaymentIntent = await retrievePaymentIntentIfPresent(
        stripeClient,
        resolvedPaymentIntent,
    );
  }

  if (!resolvedPaymentIntent) {
    return {
      paymentStatus: PAYMENT_STATUS.FAILED,
      releasedPaymentIntentId: null,
      stripeRefundId: null,
    };
  }

  if (resolvedPaymentIntent.status === "canceled") {
    return {
      paymentStatus: PAYMENT_STATUS.RELEASED,
      releasedPaymentIntentId: resolvedPaymentIntent.id,
      stripeRefundId: null,
    };
  }

  if (resolvedPaymentIntent.status === "requires_capture") {
    const canceledIntent = await stripeClient.paymentIntents.cancel(
        resolvedPaymentIntent.id,
        {cancellation_reason: reason},
    );
    return {
      paymentStatus: PAYMENT_STATUS.RELEASED,
      releasedPaymentIntentId: canceledIntent.id,
      stripeRefundId: null,
    };
  }

  if (resolvedPaymentIntent.status === "succeeded") {
    const refund = await stripeClient.refunds.create({
      payment_intent: resolvedPaymentIntent.id,
      reason: "requested_by_customer",
    });
    return {
      paymentStatus: PAYMENT_STATUS.REFUNDED,
      releasedPaymentIntentId: resolvedPaymentIntent.id,
      stripeRefundId: refund.id,
    };
  }

  return {
    paymentStatus: PAYMENT_STATUS.FAILED,
    releasedPaymentIntentId: resolvedPaymentIntent.id || null,
    stripeRefundId: null,
  };
}

/**
 * @param {object} params
 * @param {string} params.bookingId
 * @param {object} params.bookingData
 * @param {string} params.reason
 * @param {string} params.paymentStatus
 * @param {string=} params.stripeRefundId
 * @param {string=} params.stripePaymentIntentId
 * @return {Promise<void>}
 */
async function markConsultationBookingExpired({
  bookingId,
  bookingData,
  reason,
  paymentStatus,
  stripeRefundId,
  stripePaymentIntentId,
}) {
  await writeConsultationBookingAndSlot({
    bookingId,
    slotId: bookingData.slotId || null,
    bookingPatch: {
      bookingStatus: BOOKING_STATUS.EXPIRED,
      paymentStatus,
      cancellationReason: reason,
      cancellationOutcome: "released",
      stripeRefundId: stripeRefundId || null,
      stripePaymentIntentId: stripePaymentIntentId || null,
      nextActionAt: null,
      nextActionType: null,
      paymentReleasedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    slotPatch: {
      status: SLOT_STATUS.AVAILABLE,
      activeBookingId: null,
      bookedBookingId: null,
      holdExpiresAt: null,
    },
  });
}

/**
 * @param {object} params
 * @param {object} params.stripeClient
 * @param {object|string} params.checkoutSession
 * @param {string=} params.fallbackFirebaseUID
 * @return {Promise<object>}
 */
async function finalizeConsultationCheckoutSession({
  stripeClient,
  checkoutSession,
  fallbackFirebaseUID,
}) {
  let resolvedSession = checkoutSession;

  if (!resolvedSession || typeof resolvedSession === "string") {
    resolvedSession = await retrieveExpandedConsultationCheckoutSession(
        stripeClient,
        resolvedSession,
    );
  } else if (
    !resolvedSession.payment_intent ||
    typeof resolvedSession.payment_intent === "string"
  ) {
    resolvedSession = await retrieveExpandedConsultationCheckoutSession(
        stripeClient,
        resolvedSession.id,
    );
  }

  if (resolvedSession.mode !== "payment") {
    throw createHttpError(
        "Checkout session is not a consultation payment session",
        400,
    );
  }

  if (
    getObjectMetadataValue(resolvedSession, "bookingKind") !== "consultation"
  ) {
    throw createHttpError(
        "Checkout session is not a consultation booking session",
        400,
    );
  }

  if (resolvedSession.status !== "complete") {
    throw createHttpError("Checkout session has not completed yet", 409);
  }

  if (resolvedSession.payment_status !== "paid") {
    throw createHttpError("Checkout session payment is not complete yet", 409);
  }

  const rawBookingId = getObjectMetadataValue(resolvedSession, "bookingId");

  if (!rawBookingId) {
    throw createHttpError(
        "Checkout session is missing consultation booking metadata",
        400,
    );
  }

  const bookingId = normalizeFirestoreDocumentId(rawBookingId, "bookingId");

  const bookingRef = getConsultationBookingCollection().doc(bookingId);
  const bookingSnap = await bookingRef.get();

  if (!bookingSnap.exists) {
    throw createHttpError("Consultation booking was not found", 404);
  }

  const bookingData = bookingSnap.data();
  const resolvedFirebaseUID = fallbackFirebaseUID ||
    await resolveFirebaseUidForCheckoutSession(
        stripeClient,
        resolvedSession,
    );

  if (resolvedFirebaseUID && bookingData.userUid !== resolvedFirebaseUID) {
    throw createHttpError(
        "Checkout session does not belong to this user",
        403,
    );
  }

  const paymentIntent = resolvedSession.payment_intent;

  if (!paymentIntent || typeof paymentIntent === "string") {
    throw createHttpError(
        "Checkout session payment intent is unavailable",
        400,
    );
  }

  const slotRef = getConsultationSlotCollection().doc(bookingData.slotId);
  const slotSnap = await slotRef.get();
  const slotData = slotSnap.exists ? slotSnap.data() : null;
  const paymentIntentId = paymentIntent.id;

  if (!slotData || !isConsultationSlotReservedForBooking(slotData, bookingId)) {
    const releaseResult = await releaseConsultationPaymentForFailedBooking({
      stripeClient,
      paymentIntent,
      reason: "abandoned",
    });

    await markConsultationBookingExpired({
      bookingId,
      bookingData,
      reason: "slot_no_longer_reserved",
      paymentStatus: releaseResult.paymentStatus,
      stripeRefundId: releaseResult.stripeRefundId,
      stripePaymentIntentId: releaseResult.releasedPaymentIntentId,
    });

    throw createHttpError(
        "This consultation slot is no longer available",
        409,
    );
  }

  await writeConsultationBookingAndSlot({
    bookingId,
    slotId: bookingData.slotId,
    bookingPatch: {
      bookingStatus: BOOKING_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.CAPTURED,
      stripeCheckoutSessionId: resolvedSession.id,
      stripePaymentIntentId: paymentIntentId,
      nextActionAt: null,
      nextActionType: null,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    slotPatch: {
      status: SLOT_STATUS.BOOKED,
      activeBookingId: bookingId,
      bookedBookingId: bookingId,
      holdExpiresAt: null,
    },
  });

  const refreshedBookingSnap = await bookingRef.get();

  return {
    confirmed: true,
    booking: serializeConsultationBooking(
        bookingId,
        refreshedBookingSnap.data(),
    ),
  };
}

/**
 * @param {object} params
 * @param {object} params.stripeClient
 * @param {string} params.bookingId
 * @param {object} params.bookingData
 * @return {Promise<object>}
 */
async function expireConsultationPendingBooking({
  stripeClient,
  bookingId,
  bookingData,
}) {
  const checkoutSessionId = bookingData.stripeCheckoutSessionId || null;

  if (checkoutSessionId) {
    const checkoutSession = await retrieveExpandedConsultationCheckoutSession(
        stripeClient,
        checkoutSessionId,
    );

    if (checkoutSession.status === "complete") {
      return finalizeConsultationCheckoutSession({
        stripeClient,
        checkoutSession,
        fallbackFirebaseUID: bookingData.userUid,
      });
    }
  }

  await writeConsultationBookingAndSlot({
    bookingId,
    slotId: bookingData.slotId || null,
    bookingPatch: {
      bookingStatus: BOOKING_STATUS.EXPIRED,
      paymentStatus: PAYMENT_STATUS.FAILED,
      cancellationReason: "checkout_expired",
      cancellationOutcome: "released",
      nextActionAt: null,
      nextActionType: null,
    },
    slotPatch: {
      status: SLOT_STATUS.AVAILABLE,
      activeBookingId: null,
      holdExpiresAt: null,
    },
  });

  return {
    confirmed: false,
    expired: true,
  };
}

/**
 * @param {object} params
 * @param {object} params.stripeClient
 * @param {string} params.bookingId
 * @param {object} params.bookingData
 * @param {boolean} params.refundEligible
 * @param {string} params.cancellationReason
 * @return {Promise<object>}
 */
async function cancelConsultationBookingRecord({
  stripeClient,
  bookingId,
  bookingData,
  refundEligible,
  cancellationReason,
}) {
  const paymentIntent = await retrievePaymentIntentIfPresent(
      stripeClient,
      bookingData.stripePaymentIntentId,
  );
  let paymentStatus = bookingData.paymentStatus || PAYMENT_STATUS.FAILED;
  let stripeRefundId = null;

  if (refundEligible) {
    const releaseResult = await releaseConsultationPaymentForFailedBooking({
      stripeClient,
      paymentIntent,
      reason: "requested_by_customer",
    });
    paymentStatus = releaseResult.paymentStatus;
    stripeRefundId = releaseResult.stripeRefundId;
  } else if (paymentIntent && paymentIntent.status === "requires_capture") {
    await stripeClient.paymentIntents.capture(paymentIntent.id);
    paymentStatus = PAYMENT_STATUS.CAPTURED;
  } else if (paymentIntent && paymentIntent.status === "succeeded") {
    paymentStatus = PAYMENT_STATUS.CAPTURED;
  }

  await writeConsultationBookingAndSlot({
    bookingId,
    slotId: bookingData.slotId || null,
    bookingPatch: {
      bookingStatus: BOOKING_STATUS.CANCELED,
      paymentStatus,
      stripeRefundId,
      cancellationReason,
      cancellationOutcome: refundEligible ?
        (paymentStatus === PAYMENT_STATUS.RELEASED ? "released" : "refunded") :
        "non_refundable",
      canceledAt: admin.firestore.FieldValue.serverTimestamp(),
      nextActionAt: null,
      nextActionType: null,
      paidAt: !refundEligible && paymentStatus === PAYMENT_STATUS.CAPTURED ?
        admin.firestore.FieldValue.serverTimestamp() :
        bookingData.paidAt || null,
      paymentReleasedAt: refundEligible ?
        admin.firestore.FieldValue.serverTimestamp() :
        bookingData.paymentReleasedAt || null,
    },
    slotPatch: {
      status: SLOT_STATUS.AVAILABLE,
      activeBookingId: null,
      bookedBookingId: null,
      holdExpiresAt: null,
    },
  });

  const refreshedBookingSnap = await getConsultationBookingCollection()
      .doc(bookingId)
      .get();

  return {
    canceled: true,
    booking: serializeConsultationBooking(
        bookingId,
        refreshedBookingSnap.data(),
    ),
  };
}

/**
 * @param {object} params
 * @param {string} params.coachUid
 * @param {number} params.startsAtMs
 * @param {number} params.endsAtMs
 * @param {string=} params.ignoreSlotId
 * @return {Promise<void>}
 */
async function assertNoOverlappingConsultationSlot({
  coachUid,
  startsAtMs,
  endsAtMs,
  ignoreSlotId,
}) {
  const existingSlotsSnap = await getConsultationSlotCollection()
      .where("coachUid", "==", coachUid)
      .get();

  existingSlotsSnap.forEach((slotSnap) => {
    if (ignoreSlotId && slotSnap.id === ignoreSlotId) {
      return;
    }

    const slotData = slotSnap.data();

    if (
      [SLOT_STATUS.BOOKED, SLOT_STATUS.HELD, SLOT_STATUS.AVAILABLE].includes(
          slotData.status,
      ) &&
      hasIntervalOverlap(
          startsAtMs,
          endsAtMs,
          timeValueToMs(slotData.startsAt),
          timeValueToMs(slotData.endsAt),
      )
    ) {
      throw createHttpError(
          "This slot overlaps with an existing consultation " +
          "availability window",
          409,
      );
    }
  });
}

/**
 * @param {object} params
 * @param {string} params.userUid
 * @param {number} params.startsAtMs
 * @param {number} params.endsAtMs
 * @return {Promise<void>}
 */
async function assertUserHasNoOverlappingConsultationBooking({
  userUid,
  startsAtMs,
  endsAtMs,
}) {
  const userBookingsSnap = await getConsultationBookingCollection()
      .where("userUid", "==", userUid)
      .get();

  userBookingsSnap.forEach((bookingSnap) => {
    const bookingData = bookingSnap.data();

    if (
      [BOOKING_STATUS.CHECKOUT_PENDING, BOOKING_STATUS.CONFIRMED].includes(
          bookingData.bookingStatus,
      ) &&
      hasIntervalOverlap(
          startsAtMs,
          endsAtMs,
          timeValueToMs(bookingData.startsAt),
          timeValueToMs(bookingData.endsAt),
      )
    ) {
      throw createHttpError(
          "You already have a consultation booking that overlaps this slot",
          409,
      );
    }
  });
}

/**
 * Cloud Function: Upsert Consultation Availability
 * Allows admins to create or update consultation slots without frontend work.
 */
exports.upsertConsultationAvailability = functions.https.onRequest(
    {invoker: "public"},
    async (req, res) => {
      setCorsHeaders(res);

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      try {
        const authUser = await getAuthenticatedUser(req);
        await assertAdminUser(authUser);

        const requestBody = getValidatedRequestBody(req);
        const requestedSlots = Array.isArray(requestBody.slots) ?
          requestBody.slots :
          [requestBody];

        if (requestedSlots.length === 0 || requestedSlots.length > 50) {
          throw createHttpError(
              "Between 1 and 50 consultation slots are required",
              400,
          );
        }

        const nowMs = Date.now();
        const savedSlots = [];

        for (const rawSlotInput of requestedSlots) {
          const slotInput = requirePlainObject(rawSlotInput, "slot");
          const startsAt = parseIsoDate(slotInput.startsAt, "startsAt");
          const endsAt = parseIsoDate(slotInput.endsAt, "endsAt");
          assertValidSlotWindow(startsAt, endsAt);

          const amount = normalizeInteger(slotInput.amount, {
            fieldName: "amount",
            min: 1,
            max: 100000000,
          });

          const slotId = typeof slotInput.slotId === "string" &&
            slotInput.slotId.trim() ?
            normalizeFirestoreDocumentId(slotInput.slotId, "slotId") :
            getConsultationSlotCollection().doc().id;
          const coachUid = typeof slotInput.coachUid === "string" &&
            slotInput.coachUid.trim() ?
            normalizeFirestoreDocumentId(slotInput.coachUid, "coachUid") :
            authUser.uid;
          const slotRef = getConsultationSlotCollection().doc(slotId);
          const existingSlotSnap = await slotRef.get();

          if (existingSlotSnap.exists) {
            const existingSlotData = existingSlotSnap.data();
            const existingStatus = getConsultationSlotStatusForRead(
                existingSlotData,
                nowMs,
            );

            if (
              existingStatus === SLOT_STATUS.BOOKED ||
              existingStatus === SLOT_STATUS.HELD
            ) {
              throw createHttpError(
                  "Booked or actively held consultation slots cannot be edited",
                  409,
              );
            }
          }

          await assertNoOverlappingConsultationSlot({
            coachUid,
            startsAtMs: startsAt.getTime(),
            endsAtMs: endsAt.getTime(),
            ignoreSlotId: slotId,
          });

          const slotData = {
            title: normalizeBoundedString(slotInput.title, {
              maxLength: 120,
              fieldName: "title",
            }) || "Consultation",
            description: normalizeBoundedString(slotInput.description, {
              maxLength: 1000,
              fieldName: "description",
            }),
            coachUid,
            startsAt: admin.firestore.Timestamp.fromDate(startsAt),
            endsAt: admin.firestore.Timestamp.fromDate(endsAt),
            timezone: normalizeBoundedString(slotInput.timezone, {
              maxLength: 80,
              fieldName: "timezone",
            }) || "UTC",
            amount,
            currency: normalizeCurrency(
                slotInput.currency,
                CONSULTATION_DEFAULT_CURRENCY,
            ),
            meetingType: normalizeBoundedString(slotInput.meetingType, {
              maxLength: 40,
              fieldName: "meetingType",
            }) || "video",
            location: normalizeBoundedString(slotInput.location, {
              maxLength: 500,
              fieldName: "location",
            }),
            status: slotInput.status === SLOT_STATUS.UNAVAILABLE ?
              SLOT_STATUS.UNAVAILABLE :
              SLOT_STATUS.AVAILABLE,
            activeBookingId: null,
            bookedBookingId: null,
            holdExpiresAt: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          if (!existingSlotSnap.exists) {
            slotData.createdAt = admin.firestore.FieldValue.serverTimestamp();
          }

          await slotRef.set(slotData, {merge: true});

          const savedSlotSnap = await slotRef.get();
          savedSlots.push(
              serializeConsultationSlot(
                  savedSlotSnap.id,
                  savedSlotSnap.data(),
                  nowMs,
                  true,
              ),
          );
        }

        return res.json({
          saved: true,
          slots: savedSlots,
          bookingPolicy: getConsultationPolicy(),
        });
      } catch (error) {
        console.error("Upsert consultation availability error:", error);
        return res.status(getHttpStatusCode(error)).json({
          error: getClientSafeErrorMessage(error),
        });
      }
    },
);

/**
 * Cloud Function: List Consultation Availability
 * Returns upcoming public consultation slots for calendar rendering.
 */
exports.listConsultationAvailability = functions.https.onRequest(
    {invoker: "public"},
    async (req, res) => {
      setCorsHeaders(res);

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (!["GET", "POST"].includes(req.method)) {
        return res.status(405).send("Method Not Allowed");
      }

      try {
        const requestData = req.method === "GET" ?
          req.query :
          getValidatedRequestBody(req);
        const startsAfter = requestData.startsAfter ?
          parseIsoDate(requestData.startsAfter, "startsAfter") :
          new Date();
        const endsBefore = requestData.endsBefore ?
          parseIsoDate(requestData.endsBefore, "endsBefore") :
          null;
        const coachUid = typeof requestData.coachUid === "string" &&
          requestData.coachUid.trim() ?
          normalizeFirestoreDocumentId(requestData.coachUid, "coachUid") :
          null;
        const limit = Math.min(
            normalizeInteger(requestData.limit, {
              fieldName: "limit",
              fallback: 50,
              min: 1,
              max: 200,
            }),
            200,
        );
        const nowMs = Date.now();
        const futureSlotsSnap = await getConsultationSlotCollection()
            .where(
                "startsAt",
                ">=",
                admin.firestore.Timestamp.fromDate(startsAfter),
            )
            .limit(limit * 4)
            .get();

        const availableSlots = futureSlotsSnap.docs
            .filter((slotSnap) => {
              const slotData = slotSnap.data();
              const startsAtMs = timeValueToMs(slotData.startsAt);
              const slotStatus = getConsultationSlotStatusForRead(
                  slotData,
                  nowMs,
              );

              if (coachUid && slotData.coachUid !== coachUid) {
                return false;
              }

              if (slotStatus !== SLOT_STATUS.AVAILABLE) {
                return false;
              }

              if (startsAtMs && startsAtMs <= nowMs) {
                return false;
              }

              if (
                endsBefore &&
                startsAtMs &&
                startsAtMs > endsBefore.getTime()
              ) {
                return false;
              }

              return true;
            })
            .sort((leftSlot, rightSlot) => (
              timeValueToMs(leftSlot.data().startsAt) -
              timeValueToMs(rightSlot.data().startsAt)
            ))
            .slice(0, limit)
            .map((slotSnap) => serializeConsultationSlot(
                slotSnap.id,
                slotSnap.data(),
                nowMs,
            ));

        return res.json({
          slots: availableSlots,
          bookingPolicy: getConsultationPolicy(),
        });
      } catch (error) {
        console.error("List consultation availability error:", error);
        return res.status(getHttpStatusCode(error)).json({
          error: getClientSafeErrorMessage(error),
        });
      }
    },
);

/**
 * Cloud Function: Create Consultation Checkout Session
 * Reserves a slot and creates a hosted Stripe Checkout session.
 */
exports.createConsultationCheckoutSession = functions.https.onRequest(
    {invoker: "public", secrets: [stripeSecretKeyParam]},
    async (req, res) => {
      setCorsHeaders(res);

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      let bookingId = null;
      let bookingData = null;

      try {
        const authUser = await getAuthenticatedUser(req);
        const secretKey = getRequiredSecretValue(
            stripeSecretKeyParam,
            "STRIPE_SECRET_KEY",
        );
        const stripeClient = stripe(secretKey);
        const requestBody = getValidatedRequestBody(req);
        const slotId = typeof requestBody.slotId === "string" &&
          requestBody.slotId.trim() ?
          normalizeFirestoreDocumentId(requestBody.slotId, "slotId") :
          null;
        const returnTo = normalizeSafeReturnToPath(requestBody.returnTo);

        if (!slotId) {
          throw createHttpError("slotId is required", 400);
        }

        const slotRef = getConsultationSlotCollection().doc(slotId);
        const slotSnap = await slotRef.get();

        if (!slotSnap.exists) {
          throw createHttpError("Consultation slot was not found", 404);
        }

        const slotData = slotSnap.data();
        const nowMs = Date.now();
        const startsAtMs = timeValueToMs(slotData.startsAt);
        const endsAtMs = timeValueToMs(slotData.endsAt);
        const slotStatus = getConsultationSlotStatusForRead(slotData, nowMs);

        if (!startsAtMs || !endsAtMs) {
          throw createHttpError("Consultation slot timing is invalid", 500);
        }

        if (slotStatus !== SLOT_STATUS.AVAILABLE) {
          throw createHttpError("Consultation slot is not available", 409);
        }

        if (startsAtMs <= nowMs) {
          throw createHttpError(
              "Past consultation slots cannot be booked",
              409,
          );
        }

        if (
          startsAtMs >
          nowMs + CONSULTATION_MAX_BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000
        ) {
          throw createHttpError(
              `Consultations can only be booked ` +
              `${CONSULTATION_MAX_BOOKING_WINDOW_DAYS} ` +
              "days in advance with the current consultation payment policy.",
              400,
          );
        }

        await assertUserHasNoOverlappingConsultationBooking({
          userUid: authUser.uid,
          startsAtMs,
          endsAtMs,
        });

        const amount = Number.parseInt(slotData.amount, 10);

        if (!Number.isFinite(amount) || amount <= 0) {
          throw createHttpError("Consultation slot amount is invalid", 500);
        }

        const bookingRef = getConsultationBookingCollection().doc();
        bookingId = bookingRef.id;
        const checkoutExpiresAtMs = calculateCheckoutExpiryMs(
            nowMs,
            CONSULTATION_CHECKOUT_HOLD_MINUTES,
        );
        const refundableUntilMs = calculateRefundableUntilMs(
            startsAtMs,
            CONSULTATION_CANCELLATION_WINDOW_HOURS,
        );

        await getFirestoreDb().runTransaction(async (transaction) => {
          const reservedSlotSnap = await transaction.get(slotRef);

          if (!reservedSlotSnap.exists) {
            throw createHttpError("Consultation slot was not found", 404);
          }

          const reservedSlotData = reservedSlotSnap.data();
          const reservedSlotStatus = getConsultationSlotStatusForRead(
              reservedSlotData,
              nowMs,
          );

          if (reservedSlotStatus !== SLOT_STATUS.AVAILABLE) {
            throw createHttpError(
                "Consultation slot is no longer available",
                409,
            );
          }

          transaction.set(slotRef, {
            status: SLOT_STATUS.HELD,
            activeBookingId: bookingId,
            holdExpiresAt: admin.firestore.Timestamp.fromMillis(
                checkoutExpiresAtMs,
            ),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, {merge: true});

          transaction.set(bookingRef, {
            slotId,
            userUid: authUser.uid,
            coachUid: reservedSlotData.coachUid || null,
            title: reservedSlotData.title || "Consultation",
            description: reservedSlotData.description || "",
            timezone: reservedSlotData.timezone || "UTC",
            amount,
            currency: normalizeCurrency(
                reservedSlotData.currency,
                CONSULTATION_DEFAULT_CURRENCY,
            ),
            meetingType: reservedSlotData.meetingType || "video",
            location: reservedSlotData.location || "",
            startsAt: reservedSlotData.startsAt,
            endsAt: reservedSlotData.endsAt,
            bookingStatus: BOOKING_STATUS.CHECKOUT_PENDING,
            paymentStatus: PAYMENT_STATUS.CHECKOUT_PENDING,
            refundableUntil: admin.firestore.Timestamp.fromMillis(
                refundableUntilMs,
            ),
            checkoutExpiresAt: admin.firestore.Timestamp.fromMillis(
                checkoutExpiresAtMs,
            ),
            nextActionAt: admin.firestore.Timestamp.fromMillis(
                checkoutExpiresAtMs,
            ),
            nextActionType: NEXT_ACTION.EXPIRE_CHECKOUT,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });

        bookingData = {
          slotId,
          title: slotData.title || "Consultation",
          startsAt: slotData.startsAt,
          endsAt: slotData.endsAt,
          amount,
          currency: normalizeCurrency(
              slotData.currency,
              CONSULTATION_DEFAULT_CURRENCY,
          ),
        };

        const customer = await getOrCreateStripeCustomer({
          stripeClient,
          authUser,
        });
        const checkoutUrls = buildConsultationCheckoutUrls(returnTo, bookingId);
        const checkoutSession = await stripeClient.checkout.sessions.create({
          mode: "payment",
          customer: customer.id,
          client_reference_id: authUser.uid,
          payment_method_types: ["card"],
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: bookingData.currency,
                unit_amount: amount,
                product_data: {
                  name: bookingData.title,
                  description:
                    `${serializeTimestamp(slotData.startsAt)} consultation`,
                },
              },
            },
          ],
          success_url: checkoutUrls.successUrl,
          cancel_url: checkoutUrls.cancelUrl,
          metadata: {
            firebaseUID: authUser.uid,
            bookingId,
            bookingKind: "consultation",
            slotId,
          },
          payment_intent_data: {
            description: bookingData.title,
            metadata: {
              firebaseUID: authUser.uid,
              bookingId,
              bookingKind: "consultation",
              slotId,
            },
          },
        });

        if (!checkoutSession.url) {
          throw new Error("Stripe did not return a Checkout URL");
        }

        await getConsultationBookingCollection().doc(bookingId).set({
          stripeCustomerId: customer.id,
          stripeCheckoutSessionId: checkoutSession.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, {merge: true});

        return res.json({
          mode: "checkout",
          checkoutUrl: checkoutSession.url,
          sessionId: checkoutSession.id,
          bookingId,
          bookingPolicy: getConsultationPolicy(),
          holdExpiresAt: new Date(checkoutExpiresAtMs).toISOString(),
        });
      } catch (error) {
        if (bookingId && bookingData) {
          try {
            await markConsultationBookingExpired({
              bookingId,
              bookingData,
              reason: "checkout_session_creation_failed",
              paymentStatus: PAYMENT_STATUS.FAILED,
            });
          } catch (cleanupError) {
            console.error("Consultation checkout cleanup error:", cleanupError);
          }
        }

        console.error("Create consultation checkout error:", error);
        return res.status(getHttpStatusCode(error)).json({
          error: getClientSafeErrorMessage(error),
        });
      }
    },
);

/**
 * Cloud Function: Verify Consultation Checkout Session
 * Confirms the checkout belongs to the user and finalizes the booking.
 */
exports.verifyConsultationCheckoutSession = functions.https.onRequest(
    {invoker: "public", secrets: [stripeSecretKeyParam]},
    async (req, res) => {
      setCorsHeaders(res);

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
        const requestBody = getValidatedRequestBody(req);
        const sessionId = typeof requestBody.sessionId === "string" &&
          requestBody.sessionId.trim() ?
          normalizeStripeCheckoutSessionId(requestBody.sessionId) :
          null;

        if (!sessionId) {
          throw createHttpError("sessionId is required", 400);
        }

        const checkoutSession =
          await retrieveExpandedConsultationCheckoutSession(
              stripeClient,
              sessionId,
          );
        const resolvedFirebaseUID =
          await resolveFirebaseUidForCheckoutSession(
              stripeClient,
              checkoutSession,
          );

        if (resolvedFirebaseUID !== authUser.uid) {
          throw createHttpError(
              "Consultation checkout does not belong to this user",
              403,
          );
        }

        const finalizedBooking = await finalizeConsultationCheckoutSession({
          stripeClient,
          checkoutSession,
          fallbackFirebaseUID: authUser.uid,
        });

        return res.json({
          verified: true,
          sessionId,
          ...finalizedBooking,
        });
      } catch (error) {
        console.error("Verify consultation checkout error:", error);
        return res.status(getHttpStatusCode(error)).json({
          error: getClientSafeErrorMessage(error),
        });
      }
    },
);

/**
 * Cloud Function: Cancel Consultation Booking
 * Cancels and refunds/releases payment when within the 48-hour window.
 */
exports.cancelConsultationBooking = functions.https.onRequest(
    {invoker: "public", secrets: [stripeSecretKeyParam]},
    async (req, res) => {
      setCorsHeaders(res);

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
        const requestBody = getValidatedRequestBody(req);
        const bookingId = typeof requestBody.bookingId === "string" &&
          requestBody.bookingId.trim() ?
          normalizeFirestoreDocumentId(requestBody.bookingId, "bookingId") :
          null;

        if (!bookingId) {
          throw createHttpError("bookingId is required", 400);
        }

        const bookingRef = getConsultationBookingCollection().doc(bookingId);
        const bookingSnap = await bookingRef.get();

        if (!bookingSnap.exists) {
          throw createHttpError("Consultation booking was not found", 404);
        }

        let bookingData = bookingSnap.data();

        if (bookingData.userUid !== authUser.uid) {
          await assertAdminUser(authUser);
        }

        if (
          bookingData.bookingStatus === BOOKING_STATUS.CHECKOUT_PENDING &&
          bookingData.stripeCheckoutSessionId
        ) {
          try {
            const checkoutSession =
              await retrieveExpandedConsultationCheckoutSession(
                  stripeClient,
                  bookingData.stripeCheckoutSessionId,
              );

            if (checkoutSession.status === "complete") {
              await finalizeConsultationCheckoutSession({
                stripeClient,
                checkoutSession,
                fallbackFirebaseUID: bookingData.userUid,
              });
              bookingData = (await bookingRef.get()).data();
            }
          } catch (finalizeError) {
            console.warn(
                "Consultation booking was not finalized before cancel:",
                finalizeError,
            );
          }
        }

        if (
          ![BOOKING_STATUS.CHECKOUT_PENDING, BOOKING_STATUS.CONFIRMED].includes(
              bookingData.bookingStatus,
          )
        ) {
          return res.json({
            canceled: false,
            booking: serializeConsultationBooking(bookingId, bookingData),
          });
        }

        if (
          bookingData.bookingStatus === BOOKING_STATUS.CHECKOUT_PENDING &&
          !bookingData.stripePaymentIntentId
        ) {
          await writeConsultationBookingAndSlot({
            bookingId,
            slotId: bookingData.slotId || null,
            bookingPatch: {
              bookingStatus: BOOKING_STATUS.CANCELED,
              paymentStatus: PAYMENT_STATUS.FAILED,
              cancellationReason: "checkout_canceled_before_payment",
              cancellationOutcome: "released",
              canceledAt: admin.firestore.FieldValue.serverTimestamp(),
              nextActionAt: null,
              nextActionType: null,
            },
            slotPatch: {
              status: SLOT_STATUS.AVAILABLE,
              activeBookingId: null,
              bookedBookingId: null,
              holdExpiresAt: null,
            },
          });

          const canceledBookingSnap = await bookingRef.get();
          return res.json({
            canceled: true,
            booking: serializeConsultationBooking(
                bookingId,
                canceledBookingSnap.data(),
            ),
          });
        }

        const nowMs = Date.now();
        const refundableUntilMs = timeValueToMs(bookingData.refundableUntil);
        const refundEligible = Boolean(
            refundableUntilMs && nowMs < refundableUntilMs,
        );
        const cancellationResult = await cancelConsultationBookingRecord({
          stripeClient,
          bookingId,
          bookingData,
          refundEligible,
          cancellationReason: refundEligible ?
            "canceled_before_48h_cutoff" :
            "canceled_after_48h_cutoff",
        });

        return res.json({
          refundEligible,
          ...cancellationResult,
        });
      } catch (error) {
        console.error("Cancel consultation booking error:", error);
        return res.status(getHttpStatusCode(error)).json({
          error: getClientSafeErrorMessage(error),
        });
      }
    },
);

/**
 * Cloud Function: List My Consultation Bookings
 * Returns the authenticated user's consultation bookings for later UI work.
 */
exports.listMyConsultationBookings = functions.https.onRequest(
    {invoker: "public"},
    async (req, res) => {
      setCorsHeaders(res);

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (!["GET", "POST"].includes(req.method)) {
        return res.status(405).send("Method Not Allowed");
      }

      try {
        const authUser = await getAuthenticatedUser(req);
        const requestData = req.method === "GET" ?
          req.query :
          getValidatedRequestBody(req);
        const upcomingOnly = requestData.upcomingOnly === undefined ?
          true :
          normalizeBooleanFlag(requestData.upcomingOnly);
        const limit = Math.min(
            normalizeInteger(requestData.limit, {
              fieldName: "limit",
              fallback: 50,
              min: 1,
              max: 200,
            }),
            200,
        );
        const nowMs = Date.now();
        const bookingsSnap = await getConsultationBookingCollection()
            .where("userUid", "==", authUser.uid)
            .get();
        const bookings = bookingsSnap.docs
            .map((bookingSnap) => ({
              bookingId: bookingSnap.id,
              bookingData: bookingSnap.data(),
            }))
            .filter(({bookingData}) => {
              if (!upcomingOnly) {
                return true;
              }

              const startsAtMs = timeValueToMs(bookingData.startsAt);
              return startsAtMs ? startsAtMs >= nowMs : false;
            })
            .sort((leftBooking, rightBooking) => (
              timeValueToMs(leftBooking.bookingData.startsAt) -
              timeValueToMs(rightBooking.bookingData.startsAt)
            ))
            .slice(0, limit)
            .map(({bookingId, bookingData}) => serializeConsultationBooking(
                bookingId,
                bookingData,
            ));

        return res.json({
          bookings,
          bookingPolicy: getConsultationPolicy(),
        });
      } catch (error) {
        console.error("List consultation bookings error:", error);
        return res.status(getHttpStatusCode(error)).json({
          error: getClientSafeErrorMessage(error),
        });
      }
    },
);

/**
 * @param {object} stripeClient
 * @return {Promise<number>}
 */
async function reconcileDueConsultationBookings(stripeClient) {
  const nowTimestamp = admin.firestore.Timestamp.fromMillis(Date.now());
  let processedBookings = 0;

  while (processedBookings < 100) {
    const dueBookingsSnap = await getConsultationBookingCollection()
        .where("nextActionAt", "<=", nowTimestamp)
        .limit(25)
        .get();

    if (dueBookingsSnap.empty) {
      break;
    }

    for (const bookingSnap of dueBookingsSnap.docs) {
      const bookingData = bookingSnap.data();

      try {
        if (
          bookingData.nextActionType === NEXT_ACTION.EXPIRE_CHECKOUT &&
          bookingData.bookingStatus === BOOKING_STATUS.CHECKOUT_PENDING
        ) {
          await expireConsultationPendingBooking({
            stripeClient,
            bookingId: bookingSnap.id,
            bookingData,
          });
        } else {
          await writeConsultationBookingAndSlot({
            bookingId: bookingSnap.id,
            slotId: bookingData.slotId || null,
            bookingPatch: {
              nextActionAt: null,
              nextActionType: null,
            },
          });
        }
      } catch (error) {
        console.error(
            `Consultation booking reconciliation failed for ${bookingSnap.id}:`,
            error,
        );
      }

      processedBookings += 1;

      if (processedBookings >= 100) {
        break;
      }
    }

    if (dueBookingsSnap.size < 25) {
      break;
    }
  }

  return processedBookings;
}

/**
 * Scheduled Function: Reconcile Consultation Bookings
 * Cleans up expired checkout reservations for consultation bookings.
 */
exports.reconcileConsultationBookings = functions.scheduler.onSchedule(
    {
      schedule: "every 15 minutes",
      secrets: [stripeSecretKeyParam],
    },
    async () => {
      const secretKey = getRequiredSecretValue(
          stripeSecretKeyParam,
          "STRIPE_SECRET_KEY",
      );
      const stripeClient = stripe(secretKey);
      const processedBookings = await reconcileDueConsultationBookings(
          stripeClient,
      );

      console.log(
          "Consultation booking reconciliation processed " +
          `${processedBookings} booking(s).`,
      );

      return null;
    },
);

/**
 * Cloud Function: List Subscription Plans
 * Returns the Stripe-backed plan catalog for the subscription screen.
 */
exports.listSubscriptionPlans = functions.https.onRequest(
    {invoker: "public", secrets: [stripeSecretKeyParam]},
    async (req, res) => {
      setCorsHeaders(res);

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (!["GET", "POST"].includes(req.method)) {
        return res.status(405).send("Method Not Allowed");
      }

      try {
        await getAuthenticatedUser(req);
        const secretKey = getRequiredSecretValue(
            stripeSecretKeyParam,
            "STRIPE_SECRET_KEY",
        );
        const stripeClient = stripe(secretKey);
        const lookupKeys = SUBSCRIPTION_PLAN_CONFIGS.map(
            (config) => config.lookupKey,
        );
        const prices = await stripeClient.prices.list({
          lookup_keys: lookupKeys,
          active: true,
          expand: ["data.product"],
          limit: lookupKeys.length,
        });
        const priceByLookupKey = new Map();

        prices.data.forEach((price) => {
          if (price.lookup_key && !priceByLookupKey.has(price.lookup_key)) {
            priceByLookupKey.set(price.lookup_key, price);
          }
        });

        const missingLookupKeys = lookupKeys.filter(
            (lookupKey) => !priceByLookupKey.has(lookupKey),
        );

        if (missingLookupKeys.length > 0) {
          console.warn(
              "Missing Stripe prices for subscription lookup keys:",
              missingLookupKeys,
          );
        }

        const plans = SUBSCRIPTION_PLAN_CONFIGS.map((config) => {
          const price = priceByLookupKey.get(config.lookupKey);

          if (!price) {
            return null;
          }

          return serializeSubscriptionPlan(price, config.fallbackName);
        }).filter(Boolean);

        if (plans.length === 0) {
          return res.status(404).json({error: "No subscription plans found"});
        }

        return res.json({
          plans,
          trialDays: SUBSCRIPTION_TRIAL_DAYS,
        });
      } catch (error) {
        console.error("List subscription plans error:", error);
        const statusCode = error.message === "Missing authorization token" ||
          hasAuthErrorCode(error) ?
          401 :
          500;
        return res.status(statusCode).json({
          error: getClientSafeErrorMessage(error),
        });
      }
    },
);

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

        const requestBody = getValidatedRequestBody(req);
        const lookupKey = normalizeSubscriptionLookupKey(requestBody.lookupKey);
        const safeReturnTo = getSafeReturnToPath(requestBody.returnTo);

        // Fetch the price based on lookupKey
        const prices = await stripeClient.prices.list({
          lookup_keys: [lookupKey],
          active: true,
          limit: 1,
        });

        if (prices.data.length === 0) {
          return res.status(404).json({error: "Price not found"});
        }

        const customer = await getOrCreateStripeCustomer({
          stripeClient,
          authUser,
        });

        const successUrl = appendCheckoutSessionTemplate(CHECKOUT_SUCCESS_URL, {
          return_to: safeReturnTo,
        });
        const cancelUrl = appendQueryParams(CHECKOUT_CANCEL_URL, {
          canceled: "true",
          return_to: safeReturnTo,
        });
        const trialEligible = await isEligibleForSubscriptionTrial({
          stripeClient,
          customerId: customer.id,
        });
        const subscriptionMetadata = {
          firebaseUID: authUser.uid,
          lookupKey,
          returnTo: safeReturnTo,
        };
        const subscriptionData = {
          metadata: subscriptionMetadata,
          // Grant the trial only on the customer's first subscription.
          ...(trialEligible ?
            {trial_period_days: SUBSCRIPTION_TRIAL_DAYS} :
            {}),
        };

        const checkoutSession = await stripeClient.checkout.sessions.create({
          mode: "subscription",
          customer: customer.id,
          line_items: [
            {price: prices.data[0].id, quantity: 1},
          ],
          client_reference_id: authUser.uid,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            ...subscriptionMetadata,
          },
          subscription_data: subscriptionData,
        });

        if (!checkoutSession.url) {
          throw new Error("Stripe did not return a Checkout URL");
        }

        return res.json({
          mode: "checkout",
          checkoutUrl: checkoutSession.url,
          customerId: customer.id,
          sessionId: checkoutSession.id,
          trialDays: trialEligible ? SUBSCRIPTION_TRIAL_DAYS : 0,
        });
      } catch (error) {
        console.error("Checkout error:", error);
        const statusCode = error.message === "Missing authorization token" ||
          hasAuthErrorCode(error) ?
          401 :
          500;
        return res.status(statusCode).json({
          error: getClientSafeErrorMessage(error),
        });
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
        const requestBody = getValidatedRequestBody(req);
        const sessionId = normalizeStripeCheckoutSessionId(
            requestBody.sessionId,
        );

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
        return res.status(statusCode).json({
          error: getClientSafeErrorMessage(error),
        });
      }
    },
);

/**
 * Cloud Function: Refresh Subscription Status
 * Re-syncs the authenticated user's Stripe subscription into Firestore.
 */
exports.refreshSubscriptionStatus = functions.https.onRequest(
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

      if (!["GET", "POST"].includes(req.method)) {
        return res.status(405).send("Method Not Allowed");
      }

      try {
        const authUser = await getAuthenticatedUser(req);
        const requestBody = getValidatedRequestBody(req);

        if (requestBody.action === "reset_profile") {
          if (requestBody.confirmation !== PROFILE_RESET_CONFIRMATION) {
            return res.status(400).json({
              error: "Profile reset was not confirmed",
            });
          }

          return res.json(await resetAuthenticatedProfile(authUser));
        }

        const secretKey = getRequiredSecretValue(
            stripeSecretKeyParam,
            "STRIPE_SECRET_KEY",
        );
        const stripeClient = stripe(secretKey);
        const firebaseUID = normalizeFirestoreDocumentId(
            authUser.uid,
            "firebaseUID",
        );

        const combatModelSnap = await getCombatModelCollection()
            .doc(firebaseUID)
            .get();
        const userSnap = await getUsersCollection().doc(firebaseUID).get();
        const combatModelData = combatModelSnap.exists ?
          combatModelSnap.data() :
          {};
        const userData = userSnap.exists ? userSnap.data() : {};

        let subscriptionId = combatModelData.stripeSubscriptionId || null;
        const customerId = combatModelData.stripeCustomerId ||
          userData.stripeCustomerId ||
          null;

        if (!subscriptionId) {
          subscriptionId = await findSubscriptionIdForCustomer({
            stripeClient,
            customerId,
          });
        }

        if (!subscriptionId) {
          return res.json({
            refreshed: false,
            active: false,
            reason: "No Stripe subscription identifier found for user",
          });
        }

        const syncResult = await syncStripeSubscriptionToFirestore({
          stripeClient,
          subscription: subscriptionId,
          fallbackFirebaseUID: firebaseUID,
        });

        return res.json({
          refreshed: true,
          ...syncResult,
        });
      } catch (error) {
        console.error("Subscription refresh error:", error);
        const statusCode = error.message === "Missing authorization token" ||
          hasAuthErrorCode(error) ?
          401 :
          500;
        return res.status(statusCode).json({
          error: getClientSafeErrorMessage(error),
        });
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
      setCorsHeaders(res);

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

        const requestBody = getValidatedRequestBody(req);
        const sessionId = requestBody.sessionId ?
          normalizeStripeCheckoutSessionId(requestBody.sessionId) :
          "";

        if (sessionId) {
          const checkoutSession =
            await stripeClient.checkout.sessions.retrieve(sessionId);
          const resolvedFirebaseUID = checkoutSession.client_reference_id ||
            getObjectMetadataValue(checkoutSession, "firebaseUID") ||
            await resolveFirebaseUidForCustomer({
              stripeClient,
              customerId: checkoutSession.customer,
            });

          if (resolvedFirebaseUID !== authUser.uid) {
            return res.status(403).json({
              error: "Checkout session does not belong to this user",
            });
          }
        }

        // Never trust client-supplied Stripe customer IDs. Resolve or create
        // the customer from the verified Firebase user before opening portal.
        const customer = await getOrCreateStripeCustomer({
          stripeClient,
          authUser,
        });

        // Create billing portal session
        const portalSession =
          await stripeClient.billingPortal.sessions.create({
            customer: customer.id,
            return_url: BILLING_PORTAL_RETURN_URL,
          });

        return res.json({url: portalSession.url});
      } catch (error) {
        console.error("Portal error:", error);
        const statusCode = error.message === "Missing authorization token" ||
          hasAuthErrorCode(error) ?
          401 :
          500;
        return res.status(statusCode).json({
          error: getClientSafeErrorMessage(error),
        });
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
            } else if (
              event.data.object.mode === "payment" &&
              getObjectMetadataValue(event.data.object, "bookingKind") ===
                "consultation"
            ) {
              await finalizeConsultationCheckoutSession({
                stripeClient,
                checkoutSession: event.data.object,
                fallbackFirebaseUID:
                  event.data.object.client_reference_id ||
                  getObjectMetadataValue(event.data.object, "firebaseUID"),
              });
            }
            break;
          case "checkout.session.expired":
            if (
              getObjectMetadataValue(event.data.object, "bookingKind") ===
              "consultation"
            ) {
              const rawBookingId = getObjectMetadataValue(
                  event.data.object,
                  "bookingId",
              );
              const bookingId = rawBookingId ?
                normalizeFirestoreDocumentId(rawBookingId, "bookingId") :
                "";

              if (bookingId) {
                const bookingSnap = await getConsultationBookingCollection()
                    .doc(bookingId)
                    .get();

                if (
                  bookingSnap.exists &&
                  bookingSnap.data().bookingStatus ===
                    BOOKING_STATUS.CHECKOUT_PENDING
                ) {
                  await expireConsultationPendingBooking({
                    stripeClient,
                    bookingId,
                    bookingData: bookingSnap.data(),
                  });
                }
              }
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
        return res.status(500).json({error: getClientSafeErrorMessage(error)});
      }
    },
);

/**
 * Cloud Function: Generate Training Plan
 * Uses OpenAI API to generate a personalized training plan based on user inputs
 * Server-side to protect API key and handle rate limiting
 */
const DISALLOWED_TRAINING_PLAN_WRAPPER_KEYS = Object.freeze([
  "plan",
  "plans",
  "trainingPlan",
  "program",
  "planOptions",
  "options",
  "programs",
]);

const ENDURANCE_MODALITIES = Object.freeze([
  "running",
  "sprinting",
  "circuit_training",
  "heavy_bag",
  "swimming",
  "assault_bike",
  "rowing_ergometer",
  "skiing_ergometer",
  "arm_crank_machine",
]);

const ENDURANCE_FORMATS = Object.freeze([
  "steady_aerobic",
  "tempo_threshold",
  "intervals",
  "repeated_sprint",
  "recovery",
  "circuit",
]);

const ALLOWED_OPENAI_MODELS = new Set([
  "gpt-5.4",
  "gpt-5.4-mini",
]);
const ALLOWED_OPENAI_MESSAGE_ROLES = new Set(["system", "user"]);
const MAX_OPENAI_MESSAGES = 4;
const MAX_OPENAI_MESSAGE_CONTENT_LENGTH = 32000;

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasOwnProperty(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function normalizeStringValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @param {*} value
 * @return {Array<object>}
 */
function normalizeOpenAiMessages(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }

  if (value.length > MAX_OPENAI_MESSAGES) {
    throw new Error("Too many training plan prompt messages were provided.");
  }

  return value.map((message, messageIndex) => {
    if (!isPlainObject(message)) {
      throw new Error(
          `Training plan message ${messageIndex + 1} must be an object.`,
      );
    }

    const role = normalizeEnumValue(
        message.role,
        ALLOWED_OPENAI_MESSAGE_ROLES,
        `message ${messageIndex + 1} role`,
    );
    const content = normalizeBoundedString(message.content, {
      required: true,
      maxLength: MAX_OPENAI_MESSAGE_CONTENT_LENGTH,
      fieldName: `message ${messageIndex + 1} content`,
    });

    return {role, content};
  });
}

/**
 * @param {*} value
 * @return {string}
 */
function normalizeOpenAiModel(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "gpt-5.4";
  }

  return normalizeEnumValue(value, ALLOWED_OPENAI_MODELS, "model");
}

/**
 * @param {*} value
 * @return {number}
 */
function normalizeOpenAiTemperature(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  if (!Number.isFinite(parsedValue)) {
    return 0.7;
  }

  if (parsedValue < 0 || parsedValue > 2) {
    throw new Error("temperature is outside the allowed range");
  }

  return parsedValue;
}

/**
 * @param {*} value
 * @param {Array<string>} allowedValues
 * @return {string}
 */
function normalizeEnumStringValue(value, allowedValues) {
  const normalizedValue = normalizeStringValue(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  return allowedValues.includes(normalizedValue) ? normalizedValue : "";
}

function parsePositiveIntegerValue(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function parsePositiveNumberValue(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function roundToTenthValue(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

const RELATIVE_INTENSITY_ALPHA_BY_REPS = Object.freeze({
  1: 1,
  2: 0.95,
  3: 0.925,
  4: 0.9,
  5: 0.875,
  6: 0.85,
  7: 0.825,
  8: 0.8,
  9: 0.775,
  10: 0.75,
});

const VALID_LOADING_STRATEGIES = new Set([
  "flat_loading",
  "ascending_pyramid",
  "descending_pyramid",
  "double_pyramid",
]);

function calculateRelativeIntensityFromPercentOneRepMaxValue(percent1RM, reps) {
  const normalizedPercent = parsePositiveNumberValue(percent1RM);
  const normalizedReps = parsePositiveIntegerValue(reps);
  const alpha = normalizedReps ?
    RELATIVE_INTENSITY_ALPHA_BY_REPS[normalizedReps] || null :
    null;

  if (!normalizedPercent || !alpha) {
    return null;
  }

  return roundToTenthValue(normalizedPercent / alpha);
}

function calculatePercentOneRepMaxFromRelativeIntensityValue(
    relativeIntensity,
    reps,
) {
  const normalizedRelativeIntensity = parsePositiveNumberValue(relativeIntensity);
  const normalizedReps = parsePositiveIntegerValue(reps);
  const alpha = normalizedReps ?
    RELATIVE_INTENSITY_ALPHA_BY_REPS[normalizedReps] || null :
    null;

  if (!normalizedRelativeIntensity || !alpha) {
    return null;
  }

  return roundToTenthValue(normalizedRelativeIntensity * alpha);
}

function sanitizePhase(phase, phaseIndex) {
  if (!isPlainObject(phase)) {
    throw new Error(`Training plan phase ${phaseIndex + 1} must be an object.`);
  }

  const fallbackLabel = normalizeStringValue(phase.phase) ||
    normalizeStringValue(phase.name) ||
    `Phase ${phaseIndex + 1}`;
  const fallbackFocus = normalizeStringValue(phase.focus) ||
    normalizeStringValue(phase.rationale) ||
    normalizeStringValue(phase.summary) ||
    normalizeStringValue(phase.description);
  const weekStart = parsePositiveIntegerValue(phase.weekStart) ||
    parsePositiveIntegerValue(phase.startWeek) ||
    phaseIndex + 1;
  const weekEnd = parsePositiveIntegerValue(phase.weekEnd) ||
    parsePositiveIntegerValue(phase.endWeek) ||
    weekStart;

  return {
    label: normalizeStringValue(phase.label) || fallbackLabel,
    weekStart: Math.min(weekStart, weekEnd),
    weekEnd: Math.max(weekStart, weekEnd),
    focus: fallbackFocus,
  };
}

function getStrictSubstitutionSource(exercise) {
  for (const field of ["substitutionOptions", "substitutes", "alternatives"]) {
    if (!hasOwnProperty(exercise, field)) {
      continue;
    }

    if (!Array.isArray(exercise[field])) {
      throw new Error(
          `Training plan exercise field "${field}" must be an array when provided.`,
      );
    }

    return exercise[field];
  }

  return [];
}

function sanitizeStrengthAssessment(strengthAssessment, fallbackLiftName = "") {
  if (strengthAssessment == null) {
    return null;
  }

  if (!isPlainObject(strengthAssessment)) {
    throw new Error("Training plan strengthAssessment must be an object.");
  }

  const rawMethod = normalizeStringValue(strengthAssessment.method);
  const methodAliases = {
    heavy_single: "rpe_based_1rm",
  };
  const method = methodAliases[rawMethod] || rawMethod;
  const validMethods = new Set(["true_1rm", "multi_rm", "rpe_based_1rm"]);

  if (!validMethods.has(method)) {
    throw new Error(
        `Training plan strengthAssessment method "${rawMethod}" is invalid.`,
    );
  }

  const liftName =
    normalizeStringValue(strengthAssessment.liftName) ||
    normalizeStringValue(strengthAssessment.lift) ||
    fallbackLiftName;

  return {
    method,
    liftName,
    prompt: normalizeStringValue(strengthAssessment.prompt),
  };
}

function getStrengthAssessmentTopSetReps(exercise = {}) {
  const method = exercise?.strengthAssessment?.method;

  if (method === "true_1rm") {
    return "1";
  }

  const prescribedReps = normalizeStringValue(exercise?.reps);
  const leadingRepTarget = prescribedReps.match(
      /^\s*(\d+(?:\s*[-–]\s*\d+)?)/,
  );

  if (leadingRepTarget?.[1]) {
    return leadingRepTarget[1].replace(/\s+/g, "");
  }

  return method === "multi_rm" ? "2-5" : "3-5";
}

function getStrengthAssessmentTopSetNotes(notes = "") {
  const notesWithoutBackOffWork = normalizeStringValue(notes)
      .replace(
          /\s*Work up to the prescribed top set only; do not perform back-off sets\.\s*/gi,
          " ",
      )
      .replace(
          /\s*,?\s*(?:before|then|followed by|plus|and)\s+(?:the\s+)?(?:\d+\s+)?back[- ]off(?:\s+sets?|\s+work)?[^.]*\.?/gi,
          ".",
      )
      .replace(/\s{2,}/g, " ")
      .trim();

  return [
    notesWithoutBackOffWork,
    "Work up to the prescribed top set only; do not perform back-off sets.",
  ].filter(Boolean).join(" ");
}

function applyStrengthAssessmentTopSetOnly(exercise = {}) {
  if (!exercise?.strengthAssessment) {
    return exercise;
  }

  const reps = getStrengthAssessmentTopSetReps(exercise);

  return {
    ...exercise,
    sets: "1 top set",
    reps,
    notes: getStrengthAssessmentTopSetNotes(exercise.notes),
    percentagePrescription: null,
    substitutionOptions: Array.isArray(exercise.substitutionOptions) ?
      exercise.substitutionOptions.map((option) => ({
        ...option,
        sets: "1 top set",
        reps,
        notes: getStrengthAssessmentTopSetNotes(option.notes),
      })) :
      [],
  };
}

function sanitizePerformanceTarget(performanceTarget, fallbackLiftName = "") {
  if (performanceTarget == null) {
    return null;
  }

  if (!isPlainObject(performanceTarget)) {
    throw new Error("Training plan performanceTarget must be an object.");
  }

  const rawStrategy = normalizeStringValue(performanceTarget.strategy);
  const strategyAliases = {
    percentage_top_set_check: "e1rm",
    percentage_with_top_set: "e1rm",
    percentage_with_top_set_check: "e1rm",
  };
  const strategy = strategyAliases[rawStrategy] || rawStrategy;
  const validStrategies = new Set(["e1rm", "best_set", "fixed_rpe"]);

  if (!validStrategies.has(strategy)) {
    throw new Error(
        `Training plan performanceTarget strategy "${rawStrategy}" is invalid.`,
    );
  }

  return {
    strategy,
    liftName:
      normalizeStringValue(performanceTarget.liftName) ||
      normalizeStringValue(performanceTarget.referenceLift) ||
      fallbackLiftName,
    repTarget:
      parsePositiveIntegerValue(
          performanceTarget.repTarget || performanceTarget.reps,
      ) || null,
    targetRpe:
      parsePositiveNumberValue(
          performanceTarget.targetRpe || performanceTarget.rpe,
      ) || null,
    prompt: normalizeStringValue(performanceTarget.prompt),
  };
}

/**
 * @param {*} endurancePrescription
 * @return {object|null}
 */
function sanitizeEndurancePrescription(endurancePrescription) {
  if (endurancePrescription == null) {
    return null;
  }

  if (!isPlainObject(endurancePrescription)) {
    throw new Error("Training plan endurancePrescription must be an object.");
  }

  const durationMinutes = parsePositiveIntegerValue(
      endurancePrescription.durationMinutes || endurancePrescription.duration,
  );
  const rounds = parsePositiveIntegerValue(endurancePrescription.rounds);
  const sanitizedPrescription = {
    modality: normalizeEnumStringValue(
        endurancePrescription.modality,
        ENDURANCE_MODALITIES,
    ),
    format: normalizeEnumStringValue(
        endurancePrescription.format,
        ENDURANCE_FORMATS,
    ),
    durationMinutes: durationMinutes || null,
    intensity: normalizeStringValue(endurancePrescription.intensity),
    work: normalizeStringValue(endurancePrescription.work),
    rest: normalizeStringValue(endurancePrescription.rest),
    rounds: rounds || null,
    target: normalizeStringValue(endurancePrescription.target),
    notes: normalizeStringValue(endurancePrescription.notes),
  };

  if (!Object.values(sanitizedPrescription).some(Boolean)) {
    return null;
  }

  return sanitizedPrescription;
}

function sanitizePercentageWorkingSet(workingSet, workingSetIndex) {
  if (!isPlainObject(workingSet)) {
    throw new Error(
        `Training plan percentage working set ${workingSetIndex + 1} must be an object.`,
    );
  }

  const reps = parsePositiveIntegerValue(workingSet.reps);
  const explicitPercent1RM = parsePositiveNumberValue(
      workingSet.percent1RM || workingSet.percent || workingSet.intensity,
  );
  const explicitRelativeIntensity = parsePositiveNumberValue(
      workingSet.relativeIntensity || workingSet.ri || workingSet.RI,
  );
  const percent1RM = explicitPercent1RM ||
    calculatePercentOneRepMaxFromRelativeIntensityValue(
        explicitRelativeIntensity,
        reps,
    );

  if (!reps || !percent1RM) {
    throw new Error(
        `Training plan percentage working set ${workingSetIndex + 1} must include reps and either percent1RM or relativeIntensity.`,
    );
  }

  return {
    count: parsePositiveIntegerValue(workingSet.count || workingSet.sets) || 1,
    reps,
    percent1RM: roundToTenthValue(percent1RM),
    relativeIntensity:
      calculateRelativeIntensityFromPercentOneRepMaxValue(percent1RM, reps) ||
      roundToTenthValue(explicitRelativeIntensity),
  };
}

function sanitizePercentagePrescription(
    percentagePrescription,
    fallbackLiftName = "",
) {
  if (percentagePrescription == null) {
    return null;
  }

  if (!isPlainObject(percentagePrescription)) {
    throw new Error("Training plan percentagePrescription must be an object.");
  }

  const workingSetsSource = Array.isArray(percentagePrescription.workingSets) ?
    percentagePrescription.workingSets :
    Array.isArray(percentagePrescription.workSets) ?
      percentagePrescription.workSets :
      Array.isArray(percentagePrescription.sets) ?
        percentagePrescription.sets :
        null;

  if (!workingSetsSource || workingSetsSource.length === 0) {
    throw new Error(
        "Training plan percentagePrescription must include a non-empty workingSets array.",
    );
  }

  const loadingStrategy = normalizeStringValue(
      percentagePrescription.loadingStrategy,
  ) ||
    normalizeStringValue(percentagePrescription.strategy) ||
    normalizeStringValue(percentagePrescription.scheme);

  return {
    referenceLiftName:
      normalizeStringValue(percentagePrescription.referenceLiftName) ||
      normalizeStringValue(percentagePrescription.liftName) ||
      normalizeStringValue(percentagePrescription.referenceLift) ||
      fallbackLiftName,
    loadingStrategy: VALID_LOADING_STRATEGIES.has(loadingStrategy) ?
      loadingStrategy :
      "",
    workingSets: workingSetsSource.map((workingSet, workingSetIndex) =>
      sanitizePercentageWorkingSet(workingSet, workingSetIndex),
    ),
  };
}

function isPullUpChinUpExerciseName(name = "") {
  const normalizedName = normalizeStringValue(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ");

  return /\b(pull ups?|chin ups?|lat pull downs?|lat pulldowns?)\b/.test(
      normalizedName,
  );
}

function includesRpeOrRirGuidance(value = "") {
  return /\b(rpe|rir|reps? in reserve|rep reserve|reserve)\b/i.test(
      normalizeStringValue(value),
  );
}

function applyPullUpChinUpRules(exercise) {
  if (!isPullUpChinUpExerciseName(exercise.name)) {
    return exercise;
  }

  return {
    ...exercise,
    notes: includesRpeOrRirGuidance(exercise.notes) ?
      exercise.notes :
      [
        exercise.notes,
        "Use RPE/RIR loading; log bodyweight, added weight, reps, and RPE/RIR.",
      ].filter(Boolean).join(" "),
    percentagePrescription: null,
    strengthAssessment: null,
  };
}

function sanitizeExercise(exercise, exerciseIndex) {
  if (!isPlainObject(exercise)) {
    throw new Error(
        `Training plan exercise ${exerciseIndex + 1} must be an object.`,
    );
  }

  const fallbackExercise = {
    name: normalizeStringValue(exercise.name),
    sets: normalizeStringValue(exercise.sets),
    reps: normalizeStringValue(exercise.reps),
    notes: normalizeStringValue(exercise.notes),
  };

  return applyStrengthAssessmentTopSetOnly(
      applyPullUpChinUpRules({
        ...fallbackExercise,
        endurancePrescription: sanitizeEndurancePrescription(
            exercise.endurancePrescription,
        ),
        performanceTarget: sanitizePerformanceTarget(
            exercise.performanceTarget,
            fallbackExercise.name,
        ),
        percentagePrescription: sanitizePercentagePrescription(
            exercise.percentagePrescription,
            fallbackExercise.name,
        ),
        strengthAssessment: sanitizeStrengthAssessment(
            exercise.strengthAssessment,
            fallbackExercise.name,
        ),
        substitutionOptions: getStrictSubstitutionSource(exercise).map(
            (option, optionIndex) =>
              sanitizeExerciseOption(option, optionIndex, fallbackExercise),
        ),
        selectedSubstitutionId: normalizeStringValue(
            exercise.selectedSubstitutionId,
        ),
      }),
  );
}

function sanitizeTrainingDay(day, dayIndex) {
  if (!isPlainObject(day)) {
    throw new Error(`Training plan day ${dayIndex + 1} must be an object.`);
  }

  if (!Array.isArray(day.exercises) || day.exercises.length === 0) {
    throw new Error(
        `Training plan day ${dayIndex + 1} must include a non-empty exercises array.`,
    );
  }

  if (
    hasOwnProperty(day, "sessionProfile") &&
    day.sessionProfile != null &&
    !isPlainObject(day.sessionProfile)
  ) {
    throw new Error(
        `Training plan day ${dayIndex + 1} has an invalid sessionProfile.`,
    );
  }

  return {
    day: parsePositiveIntegerValue(day.day) || dayIndex + 1,
    originalDayNumber: parsePositiveIntegerValue(day.originalDayNumber) ||
      parsePositiveIntegerValue(day.day) ||
      dayIndex + 1,
    sessionLabel: normalizeStringValue(day.sessionLabel) || `Day ${dayIndex + 1}`,
    preferredWeekday: normalizeStringValue(day.preferredWeekday),
    sessionProfile: day.sessionProfile ?
      {
        regions: Array.isArray(day.sessionProfile.regions) ?
          day.sessionProfile.regions :
          [],
        qualities: Array.isArray(day.sessionProfile.qualities) ?
          day.sessionProfile.qualities :
          [],
        stressLevel: normalizeStringValue(day.sessionProfile.stressLevel),
      } :
      {regions: [], qualities: [], stressLevel: ""},
    status: normalizeStringValue(day.status),
    rescueMode: normalizeStringValue(day.rescueMode),
    adjustmentReason: normalizeStringValue(day.adjustmentReason),
    adjustmentSummary: normalizeStringValue(day.adjustmentSummary),
    exercises: day.exercises.map((exercise, exerciseIndex) =>
      sanitizeExercise(exercise, exerciseIndex),
    ),
  };
}

function sanitizeTrainingWeek(week, weekIndex, options = {}) {
  const {allowAdjustmentState = true, contextLabel = "week"} = options;

  if (!isPlainObject(week)) {
    throw new Error(
        `Training plan ${contextLabel} ${weekIndex + 1} must be an object.`,
    );
  }

  if (!Array.isArray(week.days) || week.days.length === 0) {
    throw new Error(
        `Training plan ${contextLabel} ${weekIndex + 1} must include a non-empty days array.`,
    );
  }

  const sanitizedWeek = {
    week: parsePositiveIntegerValue(week.week) || weekIndex + 1,
    days: week.days.map((day, dayIndex) => sanitizeTrainingDay(day, dayIndex)),
  };

  if (allowAdjustmentState && hasOwnProperty(week, "adjustmentState")) {
    if (week.adjustmentState != null && !isPlainObject(week.adjustmentState)) {
      throw new Error(
          `Training plan week ${weekIndex + 1} has an invalid adjustmentState.`,
      );
    }

    if (isPlainObject(week.adjustmentState)) {
      sanitizedWeek.adjustmentState = {
        missedSessionCount: parsePositiveIntegerValue(
            week.adjustmentState.missedSessionCount,
        ) || 0,
        originalPlannedSessions: parsePositiveIntegerValue(
            week.adjustmentState.originalPlannedSessions,
        ) || sanitizedWeek.days.length,
        originalWeekSnapshot: hasOwnProperty(
            week.adjustmentState,
            "originalWeekSnapshot",
        ) ?
          sanitizeTrainingWeek(
              week.adjustmentState.originalWeekSnapshot,
              weekIndex,
              {
                allowAdjustmentState: false,
                contextLabel: "originalWeekSnapshot",
              },
          ) :
          undefined,
        lastMissedReason: normalizeStringValue(
            week.adjustmentState.lastMissedReason,
        ),
        lastAction: normalizeStringValue(week.adjustmentState.lastAction),
      };
    }
  }

  return sanitizedWeek;
}

function parseDirectTrainingPlanResponse(value) {
  if (!isPlainObject(value)) {
    throw new Error("Training plan response must be a single JSON object.");
  }

  const disallowedKey = DISALLOWED_TRAINING_PLAN_WRAPPER_KEYS.find((key) =>
    hasOwnProperty(value, key),
  );

  if (disallowedKey) {
    throw new Error(
        `Training plan response must be a direct plan object, not wrapped in "${disallowedKey}".`,
    );
  }

  if (!Array.isArray(value.weeks) || value.weeks.length === 0) {
    throw new Error("Training plan response did not include any training weeks.");
  }

  if (hasOwnProperty(value, "phaseOverview") && !Array.isArray(value.phaseOverview)) {
    throw new Error("Training plan response has an invalid phaseOverview.");
  }

  if (hasOwnProperty(value, "phases") && !Array.isArray(value.phases)) {
    throw new Error("Training plan response has an invalid phases array.");
  }

  const phaseSource = Array.isArray(value.phaseOverview) ?
    value.phaseOverview :
    Array.isArray(value.phases) ?
      value.phases :
      [];

  return {
    summary: normalizeStringValue(value.summary),
    phaseOverview: phaseSource.map((phase, phaseIndex) =>
      sanitizePhase(phase, phaseIndex),
    ),
    weeks: value.weeks.map((week, weekIndex) =>
      sanitizeTrainingWeek(week, weekIndex),
    ),
  };
}

exports.generateTrainingPlan = functions.https.onCall(
    {
      secrets: [openAiApiKeyParam],
      timeoutSeconds: 300,
      memory: "1GiB",
    },
    async (request) => {
      let regenerationReservation = null;
      let regenerationUserId = "";

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
        const data = requirePlainObject(request.data || {}, "request data");
        const isPlanRegeneration = data.generationIntent === "regenerate";
        if (isPlanRegeneration) {
          regenerationUserId = normalizeFirestoreDocumentId(
              request.auth.uid,
              "userId",
          );
          regenerationReservation = await reservePlanRegeneration(
              regenerationUserId,
          );
        }
        const customMessages = normalizeOpenAiMessages(data.messages);
        const hasCustomMessages = customMessages.length > 0;
        const messages = hasCustomMessages ?
          customMessages :
          buildOpenAiMessagesFromData(data);
        const model = normalizeOpenAiModel(data.model);
        const temperature = normalizeOpenAiTemperature(data.temperature);

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

        const plan = parseDirectTrainingPlanResponse(JSON.parse(content));
        console.log("Successfully generated training plan");
        return {
          success: true,
          plan,
          regenerationUsage: regenerationReservation,
        };
      } catch (error) {
        if (regenerationReservation && regenerationUserId) {
          try {
            await refundPlanRegeneration(
                regenerationUserId,
                regenerationReservation.monthKey,
            );
          } catch (refundError) {
            console.error(
                "Failed to refund plan regeneration:",
                refundError,
            );
          }
        }
        console.error("Error generating training plan:", error);
        if (error instanceof functions.https.HttpsError) {
          throw error;
        }
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
    desiredTraining,
    includeEnduranceTraining,
    enduranceTrainingIncluded,
    enduranceTraining,
    endurancePreferences,
    enduranceModality,
    preferredEnduranceModality,
    enduranceModalities,
    preferredEnduranceModalities,
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
    desiredTraining,
    includeEnduranceTraining,
    enduranceTrainingIncluded,
    enduranceTraining,
    endurancePreferences,
    enduranceModality,
    preferredEnduranceModality,
    enduranceModalities,
    preferredEnduranceModalities,
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
  const parentCycleWeeks = userInput.parentCycleWeeks || userInput.numWeeks || 12;
  const numWeeks = Math.min(userInput.generatedBlockWeeks || 4, 4);
  const batch = userInput.trainingPlanBatch || 1;
  const blockCount = Math.max(1, Math.ceil(parentCycleWeeks / 4));
  const startingWeek = userInput.blockStartWeek ||
    (((batch - 1) % blockCount) * 4) + 1;
  const endingWeek = Math.min(startingWeek + numWeeks - 1, parentCycleWeeks);
  const phaseOverviewExample = [
    {
      label: "Building",
      weekStart: 1,
      weekEnd: Math.min(4, parentCycleWeeks),
      focus: "Build the main qualities for the parent cycle.",
    },
    ...(parentCycleWeeks > 4 ? [{
      label: "Intensifying",
      weekStart: 5,
      weekEnd: Math.min(8, parentCycleWeeks),
      focus: "Progress the most important qualities while controlling fatigue.",
    }] : []),
    ...(parentCycleWeeks > 8 ? [{
      label: "Expressing",
      weekStart: 9,
      weekEnd: parentCycleWeeks,
      focus: "Convert the earlier work into sharper sport-relevant output.",
    }] : []),
  ];
  const enduranceSettings = isPlainObject(userInput.enduranceTraining) ?
    userInput.enduranceTraining :
    isPlainObject(userInput.endurancePreferences) ?
      userInput.endurancePreferences :
      {};
  const enduranceIncludeSetting =
    hasOwnProperty(userInput, "includeEnduranceTraining") ?
      userInput.includeEnduranceTraining :
      hasOwnProperty(userInput, "enduranceTrainingIncluded") ?
        userInput.enduranceTrainingIncluded :
        hasOwnProperty(enduranceSettings, "include") ?
          enduranceSettings.include :
          hasOwnProperty(enduranceSettings, "includeEnduranceTraining") ?
            enduranceSettings.includeEnduranceTraining :
            "not provided";
  const desiredTrainingSetting =
    userInput.desiredTraining ||
    userInput.goal ||
    "strength_power_endurance";

  let batchContext = "";
  if (batch > 1) {
    batchContext = `\nThis is BATCH ${batch} of the training plan. ` +
      `Weeks ${startingWeek}-${endingWeek} are being generated. ` +
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
- Default to a 12-week parent cycle unless the athlete is preparing for an
  earlier event, then shorten the cycle to fit that real timeline
- Treat each 4-week block as a checkpoint for review and adjustment inside the
  parent cycle
- Always respect the athlete's experience level
- Include dedicated endurance work only when desiredTraining is "endurance" or
  "strength_power_endurance", or when includeEnduranceTraining /
  enduranceTraining.include explicitly opts in. If desiredTraining is
  "strength_power" and there is no explicit endurance opt-in, keep
  conditioning minimal and supportive.
- Endurance must account for combat sport, trainingPhase, sportLoadLevel,
  combatTrainingIntensity, S&C frequency, preferred weekdays, sessionDuration,
  injuries, equipment, and selected modality.
- In off-camp/off-season, endurance may build aerobic base, repeated-effort
  capacity, and weak links. In fight camp/in-camp, fit endurance around
  sparring, pads, grappling, weight management, and freshness.
- Available endurance modalities are running, sprinting, circuit_training,
  heavy_bag, swimming, assault_bike, rowing_ergometer, skiing_ergometer, and
  arm_crank_machine.
- Modality guidance: use running for accessible off-camp aerobic work; sprinting
  only when speed quality and tissue tolerance are high; circuit_training for
  local muscular endurance or repeated efforts; heavy_bag for strikers and
  fight-camp specificity; swimming for low-impact aerobic/recovery work;
  assault_bike for scalable low-impact intervals; rowing_ergometer for
  measurable total-body work; skiing_ergometer for upper-body/trunk conditioning
  with low leg impact; arm_crank_machine for targeted upper-body conditioning
  or lower-body loading restrictions.
- Do not prescribe direct heavy bag, sprinting, running, circuits, or erg work
  when the matching trainingCapabilities field is "no"; choose a safer allowed
  modality and note the reason.
- When an exercise is dedicated endurance work, include an
  "endurancePrescription" object with modality, format, durationMinutes,
  intensity, and optional work, rest, rounds, target, and notes.
- **CRITICAL: ALWAYS include EXACTLY ${userInput.daysPerWeek} training days**
  **per week. No more, no less.**
- **CRITICAL: Every exercise MUST have a videoUrl pointing to a**
  **real YouTube tutorial video for that exact exercise.**
- Apply the substitutes.md logic, but encode substitute ideas directly in each
  exercise's "substitutionOptions" array so the app can render them as
  selectable replacements.
- Every exercise MUST include "substitutionOptions". Use an empty array when
  no pragmatic alternatives are needed.
- For exercises that are somewhat complex, inconvenient, or commonly
  inaccessible, include 2-5 pragmatic substitute options.
- Keep every substitute in the same movement category and training emphasis.
  Never swap to an unrelated pattern.
- Never prescribe a bare, ambiguous "Back Squat". Always name it exactly
  "Back Squat (High-Bar)" or "Back Squat (Low-Bar)" so the athlete and the
  app both know which variation is programmed. Choose the variation
  deliberately based on the athlete's goal and sport, then keep using that
  exact name for every exposure of that lift across the cycle so Program
  Max and performance history stay attached to the same lift.
- Good examples:
  - Back Squat (High-Bar) -> Front Squat / Back Squat (Low-Bar) / Safety Bar Squat
  - Bench Press -> DB Bench Press / Narrow Grip Bench Press / Weighted Dips
  - Power Clean -> Power Snatch
- Pull-ups, chin-ups, assisted pull-ups, band-assisted pull-ups, eccentric
  pull-ups, weighted pull-ups, and lat pulldowns must stay RPE/RIR-based even
  when percentage loading is selected. Never add percentagePrescription or
  strengthAssessment to those exercises.
- If performanceTarget is included, its strategy must be exactly one of
  "e1rm", "best_set", or "fixed_rpe".
- If strengthAssessment is included, its method must be exactly one of
  "rpe_based_1rm", "multi_rm", or "true_1rm".
- Every exercise with strengthAssessment is top-set-only. Set sets to
  "1 top set", work up to that top set, and stop. Never prescribe back-off
  sets, follow-up working sets, or percentagePrescription on that exercise.
- If max clean pull-up reps are not provided, do not assume the athlete
  qualifies for weighted pull-ups. Use trainingCapabilities.pullingWork
  conservatively: "no" means assisted pull-ups or lat pulldowns, "somewhat"
  means assisted or bodyweight work with reps in reserve, and "yes" means
  bodyweight progression unless the input shows 10+ clean reps.
- Treat all athlete-facing generated text such as "summary", phase focus,
  exercise "notes", substitution "notes", performance prompts, and assessment
  prompts as user-visible app copy. Include only information that is useful for
  the athlete's strength-and-conditioning experience level and stated
  capabilities: beginners get simple cues and safe priorities, intermediates
  get practical training intent, and advanced athletes get precise loading or
  progression details only when they are relevant.
- Write athlete-facing text in natural, human-like coaching language: concise
  sentences, no robotic labels, no internal reasoning, no template fragments,
  and no unexplained jargon or abbreviations.

Adapt the plan to:
- primary combat sport
- desired training emphasis (${desiredTrainingSetting})
- endurance opt-in (${String(enduranceIncludeSetting)})
- selected endurance modality/modalities:
  ${JSON.stringify({
    modality:
      userInput.enduranceModality ||
      userInput.preferredEnduranceModality ||
      enduranceSettings.modality ||
      enduranceSettings.preferredModality ||
      "",
    modalities:
      userInput.enduranceModalities ||
      userInput.preferredEnduranceModalities ||
      enduranceSettings.modalities ||
      enduranceSettings.preferredModalities ||
      [],
  }, null, 2)}
- S&C experience level (${userInput.experience || "beginner"})
- what the athlete can do safely and confidently:
  ${JSON.stringify(userInput.trainingCapabilities || {}, null, 2)}
- competition(s) or important events the athlete is preparing for:
  ${userInput.eventPreparation || "none provided"}
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
- Return EXACTLY one training plan object.
- Follow the structure below EXACTLY.
- Do not include commentary or explanation.
- Never return multiple plans, comparisons, or wrapper keys such as "plans",
  "options", or "planChoices".
- Week numbers should start at ${startingWeek}
- Include a compact "phaseOverview" for the full ${parentCycleWeeks}-week
  parent cycle, but generate week objects only for Weeks
  ${startingWeek}-${endingWeek}.
- **IMPORTANT: Each week MUST have EXACTLY ${userInput.daysPerWeek} days**
  **in the days array.**
- **IMPORTANT: Every exercise MUST include a videoUrl with a real**
  **YouTube URL for an instructional video of that exercise.**
- **IMPORTANT: Every exercise MUST include a substitutionOptions array.**
- **IMPORTANT: Each substitution option must be a full exercise object with**
  **name, sets, reps, notes, and videoUrl.**
- **IMPORTANT: Dedicated endurance exercises should include an**
  **endurancePrescription object.**

{
  "summary": "Brief description of this training phase (batch ${batch})",
  "phaseOverview": ${JSON.stringify(phaseOverviewExample, null, 4)},
  "weeks": [
    {
      "week": ${startingWeek},
      "days": [
        {
          "day": 1,
          "exercises": [
            {
              "name": "Assault Bike Intervals",
              "sets": "5",
              "reps": "2 min hard / 2 min easy",
              "notes": "Dedicated low-impact endurance work",
              "endurancePrescription": {
                "modality": "assault_bike",
                "format": "intervals",
                "durationMinutes": 20,
                "intensity": "RPE 7-8",
                "work": "5 x 2 min",
                "rest": "2 min easy spin",
                "rounds": 5,
                "target": "Repeatable hard aerobic intervals",
                "notes": "Use only for dedicated endurance work"
              },
              "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
              "substitutionOptions": [
                {
                  "name": "Rowing Ergometer Intervals",
                  "sets": "5",
                  "reps": "2 min hard / 2 min easy",
                  "notes": "Comparable low-impact interval option",
                  "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

---

Now generate exactly one training plan JSON object for Weeks
${startingWeek}-${endingWeek} only.
**CRITICAL: Each week must include EXACTLY ${userInput.daysPerWeek}**
**training days (${userInput.daysPerWeek} days objects in the "days" array).**
**CRITICAL: Every exercise MUST have a valid videoUrl field with a real**
**YouTube URL (https://www.youtube.com/watch?v=...) for that exercise.**
**CRITICAL: Every exercise MUST include a substitutionOptions array.**
Start week numbering at ${startingWeek}.
Follow periodization principles for the full ${parentCycleWeeks}-week parent
cycle, but only emit the current ${numWeeks}-week block in "weeks".
`;

  return prompt;
}
