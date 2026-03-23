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
const CHECKOUT_SUCCESS_URL =
  `${HOSTING_BASE_URL}/checkout_redirect/success.html`;
const CHECKOUT_CANCEL_URL =
  `${HOSTING_BASE_URL}/checkout_redirect/cancel.html`;
const BILLING_PORTAL_RETURN_URL =
  `${HOSTING_BASE_URL}/checkout_redirect/portal.html`;
const stripeSecretKeyParam = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecretParam = defineSecret("STRIPE_WEBHOOK_SECRET");
const openAiApiKeyParam = defineSecret("OPENAI_API_KEY");
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
  if (
    typeof returnTo !== "string" ||
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//")
  ) {
    return "";
  }

  return returnTo;
}

/**
 * @param {string} baseUrl
 * @param {object} params
 * @return {string}
 */
function appendQueryParams(baseUrl, params) {
  const url = new URL(baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
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
  const subscriptionPeriodEnd = getSubscriptionPeriodEndUnixTimestamp(
      resolvedSubscription,
  );
  const subscriptionEndDate = formatDateFromUnixTimestamp(
      subscriptionPeriodEnd,
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
 * @param {object} authUser
 * @return {Promise<void>}
 */
async function assertAdminUser(authUser) {
  const userSnap = await getUsersCollection().doc(authUser.uid).get();
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
    successUrl: appendQueryParams(CHECKOUT_SUCCESS_URL, {
      session_id: "{CHECKOUT_SESSION_ID}",
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
  const bookingRef = getConsultationBookingCollection().doc(bookingId);
  const slotRef = slotId ? getConsultationSlotCollection().doc(slotId) : null;

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

  const bookingId = getObjectMetadataValue(resolvedSession, "bookingId");

  if (!bookingId) {
    throw createHttpError(
        "Checkout session is missing consultation booking metadata",
        400,
    );
  }

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

        const requestBody = req.body || {};
        const requestedSlots = Array.isArray(requestBody.slots) ?
          requestBody.slots :
          [requestBody];

        if (requestedSlots.length === 0) {
          throw createHttpError(
              "At least one consultation slot is required",
              400,
          );
        }

        const nowMs = Date.now();
        const savedSlots = [];

        for (const slotInput of requestedSlots) {
          const startsAt = parseIsoDate(slotInput.startsAt, "startsAt");
          const endsAt = parseIsoDate(slotInput.endsAt, "endsAt");
          assertValidSlotWindow(startsAt, endsAt);

          const amount = Number.parseInt(slotInput.amount, 10);

          if (!Number.isFinite(amount) || amount <= 0) {
            throw createHttpError(
                "Consultation slot amount must be a positive integer",
                400,
            );
          }

          const slotId = typeof slotInput.slotId === "string" &&
            slotInput.slotId.trim() ?
            slotInput.slotId.trim() :
            getConsultationSlotCollection().doc().id;
          const coachUid = typeof slotInput.coachUid === "string" &&
            slotInput.coachUid.trim() ?
            slotInput.coachUid.trim() :
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
            title:
              typeof slotInput.title === "string" &&
              slotInput.title.trim() ?
              slotInput.title.trim() :
              "Consultation",
            description:
              typeof slotInput.description === "string" ?
                slotInput.description.trim() :
                "",
            coachUid,
            startsAt: admin.firestore.Timestamp.fromDate(startsAt),
            endsAt: admin.firestore.Timestamp.fromDate(endsAt),
            timezone: typeof slotInput.timezone === "string" &&
              slotInput.timezone.trim() ?
              slotInput.timezone.trim() :
              "UTC",
            amount,
            currency: normalizeCurrency(
                slotInput.currency,
                CONSULTATION_DEFAULT_CURRENCY,
            ),
            meetingType: typeof slotInput.meetingType === "string" &&
              slotInput.meetingType.trim() ?
              slotInput.meetingType.trim() :
              "video",
            location: typeof slotInput.location === "string" ?
              slotInput.location.trim() :
              "",
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
        const requestData = req.method === "GET" ? req.query : (req.body || {});
        const startsAfter = requestData.startsAfter ?
          parseIsoDate(requestData.startsAfter, "startsAfter") :
          new Date();
        const endsBefore = requestData.endsBefore ?
          parseIsoDate(requestData.endsBefore, "endsBefore") :
          null;
        const coachUid = typeof requestData.coachUid === "string" &&
          requestData.coachUid.trim() ?
          requestData.coachUid.trim() :
          null;
        const limit = Math.min(
            parsePositiveInteger(requestData.limit, 50),
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
        const requestBody = req.body || {};
        const slotId = typeof requestBody.slotId === "string" &&
          requestBody.slotId.trim() ?
          requestBody.slotId.trim() :
          null;
        const returnTo = typeof requestBody.returnTo === "string" ?
          requestBody.returnTo :
          "";

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
        const requestBody = req.body || {};
        const sessionId = typeof requestBody.sessionId === "string" &&
          requestBody.sessionId.trim() ?
          requestBody.sessionId.trim() :
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
        const requestBody = req.body || {};
        const bookingId = typeof requestBody.bookingId === "string" &&
          requestBody.bookingId.trim() ?
          requestBody.bookingId.trim() :
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
        const requestData = req.method === "GET" ? req.query : (req.body || {});
        const upcomingOnly = requestData.upcomingOnly === undefined ?
          true :
          requestData.upcomingOnly !== false &&
          requestData.upcomingOnly !== "false";
        const limit = Math.min(
            parsePositiveInteger(requestData.limit, 50),
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
exports.reconcileConsultationBookings = functions
    .runWith({secrets: [stripeSecretKeyParam]})
    .pubsub
    .schedule("every 15 minutes")
    .onRun(async () => {
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
    });

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

        const {lookupKey, returnTo} = req.body;
        const safeReturnTo = getSafeReturnToPath(returnTo);

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

        const successUrl = appendQueryParams(CHECKOUT_SUCCESS_URL, {
          session_id: "{CHECKOUT_SESSION_ID}",
          return_to: safeReturnTo,
        });
        const cancelUrl = appendQueryParams(CHECKOUT_CANCEL_URL, {
          canceled: "true",
          return_to: safeReturnTo,
        });

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
            firebaseUID: authUser.uid,
            lookupKey,
            returnTo: safeReturnTo,
          },
          subscription_data: {
            metadata: {
              firebaseUID: authUser.uid,
              lookupKey,
              returnTo: safeReturnTo,
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
        const secretKey = getRequiredSecretValue(
            stripeSecretKeyParam,
            "STRIPE_SECRET_KEY",
        );
        const stripeClient = stripe(secretKey);

        const combatModelSnap = await getCombatModelCollection()
            .doc(authUser.uid)
            .get();
        const userSnap = await getUsersCollection().doc(authUser.uid).get();
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
          fallbackFirebaseUID: authUser.uid,
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
              const bookingId = getObjectMetadataValue(
                  event.data.object,
                  "bookingId",
              );

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
