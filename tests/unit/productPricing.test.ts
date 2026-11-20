import test from 'node:test';
import assert from 'node:assert/strict';
import { computeProductPricing } from '../../server/src/lib/purchasePricing';

// Mock DB client
function createMockClient(sponsorUser: any = null) {
  return {
    user: {
      findUnique: async ({ where }: any) => {
        if (where?.referral_code === 'T2U1000') return sponsorUser;
        return null;
      },
    },
  };
}

test('computeProductPricing: charges Offer Price for non-distributor retail customer without referral', async () => {
  const client = createMockClient();
  const product = {
    mrp: '1999',
    offer_price: '1499',
    price: '1499',
    distributor_price: '1099',
    referral_discount_percent: '10',
    bv: '50',
  };
  const buyer = { id: 'user-1', is_distributor: false, package_id: null };

  const pricing = await computeProductPricing(client as any, {
    product: product as any,
    buyer: buyer as any,
    referralCode: '',
    quantity: 1,
  });

  assert.equal(pricing.mrp, 1999);
  assert.equal(pricing.offer_price, 1499);
  assert.equal(pricing.distributor_price, 1099);
  assert.equal(pricing.unit_price, 1499);
  assert.equal(pricing.discount_amount, 0);
  assert.equal(pricing.final_price, 1499);
  assert.equal(pricing.distributor_price_applied, false);
  assert.equal(pricing.retail_profit, 0);
  assert.equal(pricing.bv_amount, 50);
});

test('computeProductPricing: applies referral discount and computes retail profit for sponsor distributor', async () => {
  const sponsor = { id: 'sponsor-1', referral_code: 'T2U1000', is_distributor: true };
  const client = createMockClient(sponsor);
  const product = {
    mrp: '1999',
    offer_price: '1499',
    price: '1499',
    distributor_price: '1099',
    referral_discount_percent: '10',
    bv: '50',
  };
  const buyer = { id: 'user-1', is_distributor: false, package_id: null };

  const pricing = await computeProductPricing(client as any, {
    product: product as any,
    buyer: buyer as any,
    referralCode: 'T2U1000',
    quantity: 2,
  });

  // Base price: 1499 * 2 = 2998
  // 10% discount: 299.8
  // Final customer price: 2998 - 299.8 = 2698.2
  // DP cost: 1099 * 2 = 2198
  // Retail profit for sponsor: 2698.2 - 2198 = 500.2
  assert.equal(pricing.quantity, 2);
  assert.equal(pricing.referral_valid, true);
  assert.equal(pricing.sponsor_id, 'sponsor-1');
  assert.equal(pricing.base_price, 2998);
  assert.equal(pricing.discount_amount, 299.8);
  assert.equal(pricing.final_price, 2698.2);
  assert.equal(pricing.retail_profit, 500.2);
  assert.equal(pricing.bv_amount, 100);
});

test('computeProductPricing: charges Distributor Price (DP) when buyer is a distributor', async () => {
  const client = createMockClient();
  const product = {
    mrp: '1999',
    offer_price: '1499',
    price: '1499',
    distributor_price: '1099',
    referral_discount_percent: '10',
    bv: '50',
  };
  const buyer = { id: 'user-dist', is_distributor: true, package_id: null };

  const pricing = await computeProductPricing(client as any, {
    product: product as any,
    buyer: buyer as any,
    referralCode: '',
    quantity: 1,
  });

  assert.equal(pricing.unit_price, 1099);
  assert.equal(pricing.final_price, 1099);
  assert.equal(pricing.distributor_price_applied, true);
  assert.equal(pricing.is_distributor, true);
  assert.equal(pricing.retail_profit, 0); // Self-purchase at DP
  assert.equal(pricing.bv_amount, 50);
});
