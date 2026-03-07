/**
 * Stripe Payment Integration for LetsHelp
 *
 * Handles B2B facility subscriptions via Stripe
 */

import Stripe from 'stripe';

/**
 * Get Stripe client instance
 * Note: This should only be used on the server side
 */
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }

  return new Stripe(secretKey, {
    apiVersion: '2026-02-25.clover',
    typescript: true,
  });
}

/**
 * Facility subscription tiers
 */
export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    name: 'Monthly Facility Subscription',
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || '',
    amount: 1500, // $15.00 per resident in cents
    currency: 'usd',
    interval: 'month' as const,
  },
  ANNUAL: {
    name: 'Annual Facility Subscription',
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID || '',
    amount: 15000, // $150.00 per resident per year in cents (2 months free)
    currency: 'usd',
    interval: 'year' as const,
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

/**
 * Create a Stripe customer for a facility
 */
export async function createFacilityCustomer(params: {
  name: string;
  email: string;
  phone?: string;
}) {
  const stripe = getStripeClient();

  const customerParams: Stripe.CustomerCreateParams = {
    email: params.email,
    metadata: {
      type: 'facility',
    },
  };

  // Only add name if provided (Stripe API doesn't accept name in all cases)
  if (params.name) {
    customerParams.name = params.name;
  }

  // Only add phone if provided
  if (params.phone) {
    customerParams.phone = params.phone;
  }

  const customer = await stripe.customers.create(customerParams);

  return customer;
}

/**
 * Create a checkout session for a new facility subscription
 */
export async function createSubscriptionCheckout(params: {
  facilityId: string;
  customerId: string;
  plan: SubscriptionPlan;
  residentCount: number;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripeClient();
  const plan = SUBSCRIPTION_PLANS[params.plan];
  const quantity = params.residentCount;

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.priceId,
        quantity,
      },
    ],
    metadata: {
      facilityId: params.facilityId,
      plan: params.plan,
      residentCount: quantity.toString(),
    },
    subscription_data: {
      metadata: {
        facilityId: params.facilityId,
      },
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return checkoutSession;
}

/**
 * Create a portal session for managing existing subscription
 */
export async function createCustomerPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  const stripe = getStripeClient();

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return portalSession;
}

/**
 * Calculate invoice amount based on resident count
 */
export function calculateInvoiceAmount(params: {
  residentCount: number;
  plan: SubscriptionPlan;
}): number {
  const plan = SUBSCRIPTION_PLANS[params.plan];
  return plan.amount * params.residentCount;
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(params: {
  payload: string | Buffer;
  signature: string;
}) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
  }

  return stripe.webhooks.constructEvent(
    params.payload,
    params.signature,
    webhookSecret
  );
}

/**
 * Handle subscription updated webhook event
 */
export async function handleSubscriptionUpdated(event: Stripe.Event) {
  if (event.type !== 'customer.subscription.updated') {
    throw new Error('Invalid event type');
  }

  const subscription = event.data.object as Stripe.Subscription;
  const facilityId = subscription.metadata.facilityId;

  if (!facilityId) {
    throw new Error('Subscription missing facility_id metadata');
  }

  // TODO: Update facility in database
  // This will be implemented when we create the database queries

  return {
    facilityId,
    status: subscription.status,
  };
}

/**
 * Handle invoice paid webhook event
 */
export async function handleInvoicePaid(event: Stripe.Event) {
  if (event.type !== 'invoice.paid') {
    throw new Error('Invalid event type');
  }

  const invoice = event.data.object as Stripe.Invoice;

  // TODO: Record payment in database
  // This will be implemented when we create the database queries

  return {
    invoiceId: invoice.id,
    amount: invoice.amount_paid,
    status: invoice.status,
  };
}

/**
 * Validate Stripe environment variables
 */
export function validateStripeEnv(): { valid: boolean; missing: string[] } {
  const required = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];
  const missing: string[] = [];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
