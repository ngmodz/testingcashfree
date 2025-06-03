// Create payment record endpoint for Vercel
// In-memory storage (Note: This will reset on each deployment)
// For production, consider using a database like Vercel KV or external DB

let payments = new Map();
let users = new Map();

export default function handler(req, res) {
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
    const { order_id, user_email, amount = 999 } = req.body;

    if (!order_id || !user_email) {
      return res.status(400).json({ error: 'Missing required fields: order_id, user_email' });
    }

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create user record
    const user = {
      id: userId,
      email: user_email,
      created_at: new Date().toISOString(),
      subscription_status: 'pending',
      credits: 0
    };
    users.set(userId, user);

    // Create payment record
    const payment = {
      order_id,
      user_id: userId,
      user_email,
      amount,
      currency: 'INR',
      status: 'pending',
      created_at: new Date().toISOString(),
      verified_at: null
    };
    payments.set(order_id, payment);

    console.log(`💳 Payment record created for order ${order_id}`);

    res.status(201).json({
      success: true,
      order_id,
      user_id: userId,
      message: 'Payment record created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating payment record:', error);
    res.status(500).json({ error: 'Failed to create payment record' });
  }
}
