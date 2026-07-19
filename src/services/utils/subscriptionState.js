export function hasActiveSubscriptionEntitlement({
  active = false,
  endDate = null,
  now = new Date(),
} = {}) {
  if (!active || !endDate) {
    return false;
  }

  const normalizedNow = new Date(now);
  const normalizedEndDate = new Date(endDate);

  if (
    Number.isNaN(normalizedNow.getTime()) ||
    Number.isNaN(normalizedEndDate.getTime())
  ) {
    return false;
  }

  normalizedNow.setHours(0, 0, 0, 0);
  normalizedEndDate.setHours(0, 0, 0, 0);

  return normalizedNow <= normalizedEndDate;
}
