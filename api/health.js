// Health check endpoint for Vercel
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const environment = process.env.NODE_ENV || 'production';
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    cashfree_configured: !!(process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET),
    test_mode_enabled: environment === 'development',
    environment: environment,
    api_endpoint: environment === 'production' ? 'api.cashfree.com' : 'sandbox.cashfree.com',
    platform: 'Vercel'
  });
}
