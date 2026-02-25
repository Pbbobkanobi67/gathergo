import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    })
  : null;

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface CreateCheckoutSessionParams {
  amount: number;
  currency?: string;
  purpose: string;
  tripId: string;
  memberId: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export async function createCheckoutSession({
  amount,
  currency = "usd",
  purpose,
  tripId,
  memberId,
  successUrl,
  cancelUrl,
  metadata = {},
}: CreateCheckoutSessionParams) {
  if (!stripe) {
    return { success: false, error: "Stripe not configured" };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: purpose,
              description: `Payment for ${purpose}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || `${appUrl}/trips/${tripId}/expenses?success=true`,
      cancel_url: cancelUrl || `${appUrl}/trips/${tripId}/expenses?cancelled=true`,
      metadata: {
        tripId,
        memberId,
        purpose,
        ...metadata,
      },
    });

    return { success: true, sessionId: session.id, url: session.url };
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return { success: false, error: "Failed to create checkout session" };
  }
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  tripId: string;
  memberId: string;
  purpose: string;
  metadata?: Record<string, string>;
}

export async function createPaymentIntent({
  amount,
  currency = "usd",
  tripId,
  memberId,
  purpose,
  metadata = {},
}: CreatePaymentIntentParams) {
  if (!stripe) {
    return { success: false, error: "Stripe not configured" };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: {
        tripId,
        memberId,
        purpose,
        ...metadata,
      },
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (err) {
    console.error("Stripe payment intent error:", err);
    return { success: false, error: "Failed to create payment intent" };
  }
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  if (!stripe) {
    return { success: false, error: "Stripe not configured" };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return { success: true, paymentIntent };
  } catch (err) {
    console.error("Stripe retrieve error:", err);
    return { success: false, error: "Failed to retrieve payment intent" };
  }
}

export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event | null> {
  if (!stripe) return null;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Stripe webhook secret not configured");
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return null;
  }
}

// Handle different webhook event types
export type WebhookHandlerResult = {
  success: boolean;
  action?: string;
  error?: string;
};

export async function handleWebhookEvent(
  event: Stripe.Event
): Promise<WebhookHandlerResult> {
  switch (event.type) {
    case "checkout.session.completed": {
      // const session = event.data.object as Stripe.Checkout.Session;
      return {
        success: true,
        action: "payment_completed",
      };
    }

    case "payment_intent.succeeded": {
      // const paymentIntent = event.data.object as Stripe.PaymentIntent;
      return {
        success: true,
        action: "payment_intent_succeeded",
      };
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      return {
        success: false,
        action: "payment_failed",
        error: paymentIntent.last_payment_error?.message,
      };
    }

    default:
      return { success: true, action: "unhandled_event" };
  }
}

// Format amount for display
export function formatStripeAmount(amount: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}
