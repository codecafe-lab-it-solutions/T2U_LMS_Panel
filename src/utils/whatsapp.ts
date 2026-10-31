// Builds a wa.me click-to-chat link with a prefilled message. `rawNumber` is whatever the
// admin typed into Support WhatsApp Number (may include spaces, dashes, a leading +) — wa.me
// only accepts digits, so it's stripped down to that.
export function buildWhatsAppLink(rawNumber: string, message?: string): string {
  const digits = rawNumber.replace(/[^0-9]/g, '');
  if (!message) return `https://wa.me/${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
