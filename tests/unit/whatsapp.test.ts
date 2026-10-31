import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWhatsAppLink } from '../../src/utils/whatsapp';

test('buildWhatsAppLink: builds wa.me URL with clean digits and encoded text', () => {
  const link = buildWhatsAppLink('+91 92694 88028', 'Hello T2U Support');
  assert.equal(link, 'https://wa.me/919269488028?text=Hello%20T2U%20Support');
});

test('buildWhatsAppLink: strips non-digit characters from phone number', () => {
  const link = buildWhatsAppLink('91-9269-488-028', 'Test');
  assert.equal(link, 'https://wa.me/919269488028?text=Test');
});

test('buildWhatsAppLink: handles empty message', () => {
  const link = buildWhatsAppLink('919269488028');
  assert.equal(link, 'https://wa.me/919269488028');
});

