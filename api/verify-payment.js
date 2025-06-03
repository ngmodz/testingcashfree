// Payment verification endpoint for Vercel
// Note: In-memory storage will reset on deployment
// For production, use Vercel KV, Upstash Redis, or external database

let payments = new Map();
let users = new Map();

// Cashfree API configuration
const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;
const CASHFREE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

// Verify payment with Cashfree API
async function verifyPaymentWithCashfree(orderId) {
  try {
    // 🧪 TEST MODE: Only simulate in development environment
    if (process.env.NODE_ENV === 'development' && orderId.startsWith('order_') && orderId.includes('_')) {
      console.log(`🧪 TEST MODE: Simulating successful payment for order ${orderId}`);
      
      return {
        order_id: orderId,
        order_status: 'PAID',
        order_amount: 999.00,
        order_currency: 'INR',
        payment_method: 'TEST_PAYMENT',
        payment_time: new Date().toISOString()
      };
    }
    
    // 🔴 REAL MODE: Call actual Cashfree API
    console.log(`🔍 REAL MODE: Calling Cashfree API: ${CASHFREE_BASE_URL}/orders/${orderId}`);
    
    const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': CASHFREE_CLIENT_ID,
        'x-client-secret': CASHFREE_CLIENT_SECRET,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Cashfree API error response: ${errorText}`);
      throw new Error(`Payment verification failed: ${response.status} - ${errorText}`);
    }

    const orderData = await response.json();
    console.log('📊 Payment verification result:', {
      orderId: orderData.order_id,
      status: orderData.order_status,
      amount: orderData.order_amount,
      currency: orderData.order_currency
    });

    return orderData;
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'Missing order_id' });
    }

    console.log(`🔍 Verifying payment for order: ${order_id}`);

    // Get payment record (Note: This might not exist due to serverless nature)
    let payment = payments.get(order_id);
    
    if (!payment) {
      // Create a temporary payment record for verification
      payment = {
        order_id,
        user_id: `temp_user_${Date.now()}`,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      payments.set(order_id, payment);
    }

    // Verify with Cashfree
    const orderData = await verifyPaymentWithCashfree(order_id);
    
    // Update payment record
    payment.status = orderData.order_status.toLowerCase();
    payment.verified_at = new Date().toISOString();
    payment.cashfree_order_id = orderData.order_id;
    payment.order_amount = orderData.order_amount;
    
    console.log(`🔍 Checking payment status: ${orderData.order_status}`);

    // Only grant access for PAID status
    if (orderData.order_status === 'PAID') {
      console.log(`💰 Payment is PAID, activating subscription...`);
      console.log(`🎉 REAL PAYMENT SUCCESSFUL - 10 credits will be granted!`);
      
      res.status(200).json({
        success: true,
        status: 'PAID',
        order_id: order_id,
        amount: orderData.order_amount,
        currency: orderData.order_currency,
        verified_at: payment.verified_at,
        credits_granted: 10,
        message: 'Payment verified successfully'
      });
    } else {
      console.log(`❌ Payment NOT successful. Status: ${orderData.order_status}`);
      console.log(`❌ NO CREDITS will be granted for failed payment`);
      
      res.status(200).json({
        success: false,
        status: orderData.order_status,
        order_id: order_id,
        verified_at: payment.verified_at,
        credits_granted: 0,
        message: `Payment ${orderData.order_status.toLowerCase()}`
      });
    }

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment verification failed',
      message: 'Could not verify payment status'
    });
  }
}
