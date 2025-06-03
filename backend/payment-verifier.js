const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Cashfree API Configuration
const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;
const CASHFREE_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

// In-memory storage (replace with your database)
const payments = new Map();
const users = new Map();

// For Cashfree API v2023-08-01, we don't need a separate token
// We use direct API key authentication
async function getCashfreeToken() {
  // Return null - we'll use direct API key auth instead
  return null;
}

// Verify payment with Cashfree API (with test mode)
async function verifyPaymentWithCashfree(orderId) {
  try {
    // 🧪 TEST MODE: Only simulate in development environment
    if (process.env.NODE_ENV === 'development' && orderId.startsWith('order_') && orderId.includes('_')) {
      console.log(`🧪 TEST MODE: Simulating successful payment for order ${orderId}`);

      // Simulate successful payment response
      const mockOrderData = {
        order_id: orderId,
        order_status: 'PAID',
        order_amount: 999.00,
        order_currency: 'INR',
        payment_method: 'TEST_PAYMENT',
        payment_time: new Date().toISOString()
      };

      console.log('🎉 TEST MODE: Payment verification successful!', {
        orderId: mockOrderData.order_id,
        status: mockOrderData.order_status,
        amount: mockOrderData.order_amount,
        currency: mockOrderData.order_currency
      });

      return mockOrderData;
    }

    // 🔴 REAL MODE: Call actual Cashfree API for other orders
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

    console.log(`📡 Cashfree API response status: ${response.status}`);

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

// Get payment details including transactions
async function getPaymentDetails(orderId) {
  try {
    const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}/payments`, {
      method: 'GET',
      headers: {
        'x-client-id': CASHFREE_CLIENT_ID,
        'x-client-secret': CASHFREE_CLIENT_SECRET,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`⚠️ Payment details request failed: ${response.status}`);
      return null; // Return null if payment details not available
    }

    const paymentData = await response.json();
    return paymentData;
  } catch (error) {
    console.error('❌ Error getting payment details:', error);
    return null; // Return null on error
  }
}

// Update user access after successful payment
async function updateUserAccess(orderId, orderData) {
  try {
    const payment = payments.get(orderId);
    if (!payment) {
      console.error('❌ Payment record not found for order:', orderId);
      return false;
    }

    // Update payment record
    payment.status = orderData.order_status.toLowerCase();
    payment.verified_at = new Date().toISOString();
    payment.cashfree_order_id = orderData.order_id;
    payment.order_amount = orderData.order_amount;
    
    // If payment is successful, activate user subscription
    console.log(`🔍 Checking payment status: ${orderData.order_status}`);

    // Only grant access for PAID status - strict verification
    if (orderData.order_status === 'PAID') {
      console.log(`💰 Payment is PAID, activating subscription...`);
      const user = users.get(payment.user_id);
      console.log(`👤 User found:`, user ? 'Yes' : 'No');

      if (user) {
        user.subscription_status = 'active';
        user.subscription_start = new Date().toISOString();
        user.subscription_end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        console.log(`✅ User ${payment.user_id} subscription activated for order ${orderId}`);
        console.log(`🎉 REAL PAYMENT SUCCESSFUL - 10 credits will be granted!`);

        return true;
      } else {
        console.log(`❌ User not found for user_id: ${payment.user_id}`);
        return false;
      }
    } else {
      // Payment failed, cancelled, or pending - NO credits granted
      console.log(`❌ Payment NOT successful. Status: ${orderData.order_status}`);
      console.log(`❌ NO CREDITS will be granted for failed payment`);

      // Update payment status to failed
      payment.status = orderData.order_status.toLowerCase();
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating user access:', error);
    return false;
  }
}

// Email functionality removed - focusing on payment verification only

// API endpoint to verify payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    console.log(`🔍 Verifying payment for order: ${order_id}`);

    // Get order details from Cashfree
    const orderData = await verifyPaymentWithCashfree(order_id);
    
    // Get detailed payment information
    const paymentDetails = await getPaymentDetails(order_id);

    // Update user access if payment is successful
    const accessUpdated = await updateUserAccess(order_id, orderData);

    res.json({
      success: true,
      order_id: orderData.order_id,
      status: orderData.order_status,
      amount: orderData.order_amount,
      currency: orderData.order_currency,
      payment_details: paymentDetails,
      access_granted: accessUpdated,
      verified_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({ 
      error: 'Payment verification failed', 
      message: error.message 
    });
  }
});

// API endpoint to create payment record (call before redirecting to Cashfree)
app.post('/api/create-payment', (req, res) => {
  try {
    const { user_id, order_id, amount, user_email } = req.body;

    if (!user_id || !order_id || !amount || !user_email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Store payment record
    payments.set(order_id, {
      user_id,
      order_id,
      amount,
      status: 'pending',
      created_at: new Date().toISOString(),
      verified_at: null
    });

    // Store/update user record
    users.set(user_id, {
      id: user_id,
      email: user_email,
      subscription_status: 'pending'
    });

    console.log(`💳 Payment record created for order ${order_id}`);
    res.json({ success: true, order_id, message: 'Payment record created' });

  } catch (error) {
    console.error('❌ Error creating payment record:', error);
    res.status(500).json({ error: 'Failed to create payment record' });
  }
});

// API endpoint to check payment status
app.get('/api/payment-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Check local record first
    const localPayment = payments.get(orderId);
    
    // Also verify with Cashfree for real-time status
    let cashfreeStatus = null;
    try {
      const orderData = await verifyPaymentWithCashfree(orderId);
      cashfreeStatus = orderData.order_status;
      
      // Update local record if status changed
      if (localPayment && localPayment.status !== orderData.order_status.toLowerCase()) {
        updateUserAccess(orderId, orderData);
      }
    } catch (error) {
      console.log('⚠️ Could not fetch real-time status from Cashfree');
    }

    if (!localPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      order_id: localPayment.order_id,
      status: localPayment.status,
      cashfree_status: cashfreeStatus,
      amount: localPayment.amount,
      created_at: localPayment.created_at,
      verified_at: localPayment.verified_at
    });

  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// API endpoint to get user subscription status
app.get('/api/user-status/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const user = users.get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user_id: user.id,
      email: user.email,
      subscription_status: user.subscription_status,
      subscription_start: user.subscription_start,
      subscription_end: user.subscription_end
    });

  } catch (error) {
    console.error('❌ Error getting user status:', error);
    res.status(500).json({ error: 'Failed to get user status' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const environment = process.env.NODE_ENV || 'development';
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    cashfree_configured: !!(CASHFREE_CLIENT_ID && CASHFREE_CLIENT_SECRET),
    test_mode_enabled: environment === 'development',
    environment: environment,
    api_endpoint: environment === 'production' ? 'api.cashfree.com' : 'sandbox.cashfree.com'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Payment verification server running on port ${PORT}`);
  console.log(`🔑 Cashfree API configured: ${!!(CASHFREE_CLIENT_ID && CASHFREE_CLIENT_SECRET)}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
