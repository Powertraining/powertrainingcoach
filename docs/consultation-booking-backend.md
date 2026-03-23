# Consultation Booking Backend

## Overview

The backend now supports calendar-style consultation booking on Firebase
Functions with Stripe charge-at-booking payments.

Flow summary:

1. Admin creates consultation availability slots in Firestore through the
   `upsertConsultationAvailability` HTTPS function.
2. Clients fetch upcoming slots through `listConsultationAvailability`.
3. A customer starts checkout through `createConsultationCheckoutSession`.
   This places a temporary slot hold in Firestore and creates a Stripe
   Checkout Session in `payment` mode.
4. After checkout completes, `verifyConsultationCheckoutSession` or the Stripe
   webhook finalizes the booking once Stripe reports the session as paid.
5. The customer is charged when booking is confirmed.
6. `cancelConsultationBooking` refunds the charge when the booking is
   canceled before the 48-hour cutoff.
7. A scheduled reconciliation job expires abandoned checkout reservations and
   releases their held slot inventory.

## Payment policy

This backend now charges the customer at booking time instead of relying on a
card authorization hold. That allows bookings up to 30 days in advance
without depending on Stripe's shorter online card authorization windows.

The backend still keeps a short temporary slot hold during checkout itself so
two customers cannot pay for the same appointment at the same time.

Default policy:

- `CONSULTATION_MAX_BOOKING_WINDOW_DAYS=30`
- `CONSULTATION_CANCELLATION_WINDOW_HOURS=48`
- payment mode: charge now, refund before cutoff

## Functions

### `upsertConsultationAvailability`

Authenticated admin-only `POST`.

Accepts either one slot object or `{ "slots": [...] }`.

Example payload:

```json
{
  "slots": [
    {
      "startsAt": "2026-03-30T13:00:00.000Z",
      "endsAt": "2026-03-30T14:00:00.000Z",
      "timezone": "Europe/Zurich",
      "title": "1:1 Consultation",
      "description": "Technical review and training planning",
      "amount": 15000,
      "currency": "sek",
      "meetingType": "video",
      "location": "Google Meet"
    }
  ]
}
```

### `listConsultationAvailability`

Public `GET` or `POST`.

Supported filters:

- `startsAfter` ISO timestamp
- `endsBefore` ISO timestamp
- `coachUid`
- `limit`

### `createConsultationCheckoutSession`

Authenticated `POST`.

Payload:

```json
{
  "slotId": "slot_123",
  "returnTo": "/consultations"
}
```

Response includes:

- `checkoutUrl`
- `sessionId`
- `bookingId`
- `holdExpiresAt`
- `bookingPolicy`

### `verifyConsultationCheckoutSession`

Authenticated `POST`.

Payload:

```json
{
  "sessionId": "cs_test_123"
}
```

### `cancelConsultationBooking`

Authenticated `POST`.

Payload:

```json
{
  "bookingId": "booking_123"
}
```

### `listMyConsultationBookings`

Authenticated `GET` or `POST`.

Supported filters:

- `limit`
- `upcomingOnly`

## Firestore collections

### `consultationAvailability`

Each slot stores:

- start/end timestamps
- meeting details
- price and currency
- slot status: `available`, `unavailable`, `held`, `booked`
- active booking references when a slot is being reserved or is booked

### `consultationBookings`

Each booking stores:

- slot and user linkage
- booking status: `checkout_pending`, `confirmed`, `canceled`, `expired`
- payment status: `checkout_pending`, `captured`, `released`, `refunded`,
  `failed`
- refund deadline (`refundableUntil`)
- Stripe session / payment intent / refund identifiers

## Environment variables

Optional consultation-specific runtime configuration:

- `CONSULTATION_CHECKOUT_HOLD_MINUTES` default `30`
- `CONSULTATION_CANCELLATION_WINDOW_HOURS` default `48`
- `CONSULTATION_MAX_BOOKING_WINDOW_DAYS` default `30`
- `CONSULTATION_DEFAULT_CURRENCY` default `sek`
