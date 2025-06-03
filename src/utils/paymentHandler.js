// Payment handling utilities for Cashfree integration

const API_BASE_URL = 'http://localhost:3001';

// Generate unique order ID
export function generateOrderId() {
  return 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Generate unique user ID (you can replace this with your actual user system)
export function getCurrentUserId() {
  let userId = localStorage.getItem('study_app_user_id');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('study_app_user_id', userId);
  }
  return userId;
}

// Get user email (you can replace this with your actual user system)
export function getCurrentUserEmail() {
  let email = localStorage.getItem('study_app_user_email');
  if (!email) {
    email = prompt('Please enter your email address for payment confirmation:');
    if (email) {
      localStorage.setItem('study_app_user_email', email);
    }
  }
  return email;
}

// Create payment record before redirecting to Cashfree
export async function createPaymentRecord(orderId, amount = 999.00) {
  try {
    const userId = getCurrentUserId();
    const userEmail = getCurrentUserEmail();
    
    if (!userEmail) {
      throw new Error('Email is required for payment');
    }

    console.log('📝 Creating payment record...');
    
    const response = await fetch(`${API_BASE_URL}/api/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        order_id: orderId,
        amount: amount,
        user_email: userEmail
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create payment record');
    }

    const result = await response.json();
    console.log('✅ Payment record created:', result);
    
    // Store order ID for later verification
    localStorage.setItem('pending_order_id', orderId);
    
    return result;
  } catch (error) {
    console.error('❌ Error creating payment record:', error);
    throw error;
  }
}

// Verify payment after user returns from Cashfree
export async function verifyPayment(orderId) {
  try {
    console.log('🔍 Verifying payment for order:', orderId);
    
    const response = await fetch(`${API_BASE_URL}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId
      })
    });

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    const result = await response.json();
    console.log('📊 Payment verification result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    throw error;
  }
}

// Check payment status
export async function checkPaymentStatus(orderId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/payment-status/${orderId}`);
    
    if (!response.ok) {
      throw new Error('Failed to check payment status');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    throw error;
  }
}

// Handle Starter Pack button click
export async function handleStarterPackClick() {
  try {
    const orderId = generateOrderId();

    // Create payment record first
    await createPaymentRecord(orderId);

    // Redirect to your new real payment form
    const cashfreeUrl = `https://payments.cashfree.com/forms/starterpackreal?order_id=${orderId}`;

    // Open in same window so user returns to our app
    window.location.href = cashfreeUrl;

  } catch (error) {
    console.error('❌ Error handling starter pack click:', error);
    alert('Failed to initiate payment. Please try again.');
  }
}

// Check for payment completion when page loads
export async function checkForPaymentCompletion() {
  try {
    // Check URL parameters for order_id (Cashfree might return this)
    const urlParams = new URLSearchParams(window.location.search);
    let orderId = urlParams.get('order_id');

    // If no order_id in URL, check localStorage for pending payment
    if (!orderId) {
      orderId = localStorage.getItem('pending_order_id');
    }

    if (orderId) {
      // Check if we've already processed this order to prevent loops
      const processedOrders = JSON.parse(localStorage.getItem('processed_orders') || '[]');

      if (processedOrders.includes(orderId)) {
        console.log('🔄 Order already processed, skipping verification:', orderId);
        localStorage.removeItem('pending_order_id'); // Clean up
        return;
      }

      console.log('🔍 Found order ID, checking payment status:', orderId);

      // Small delay to ensure Cashfree has processed the payment
      setTimeout(async () => {
        try {
          const result = await verifyPayment(orderId);

          // Mark this order as processed to prevent repeated verification
          processedOrders.push(orderId);
          localStorage.setItem('processed_orders', JSON.stringify(processedOrders));
          localStorage.removeItem('pending_order_id'); // Clean up

          if (result.status === 'PAID') {
            // Payment successful!
            showSuccessPopup(result);
          } else if (result.status === 'FAILED' || result.status === 'CANCELLED') {
            // Payment failed or cancelled - show failure popup
            showFailurePopup(result);
          } else {
            // Other status (pending, etc.) - show error popup
            showErrorPopup();
          }
        } catch (error) {
          console.error('❌ Error during payment verification:', error);

          // Mark as processed even on error to prevent loops
          processedOrders.push(orderId);
          localStorage.setItem('processed_orders', JSON.stringify(processedOrders));
          localStorage.removeItem('pending_order_id');

          showErrorPopup();
        }
      }, 2000); // 2 second delay
    }
  } catch (error) {
    console.error('❌ Error checking for payment completion:', error);
  }
}

// Grant credits to user after successful payment
export function grantCredits(amount = 10) {
  localStorage.setItem('study_app_credits', amount.toString());
  localStorage.setItem('study_app_credits_granted', new Date().toISOString());

  // Trigger credits display update
  updateCreditsDisplay();

  console.log(`✅ ${amount} credits granted to user`);
}

// Get current user credits
export function getUserCredits() {
  return parseInt(localStorage.getItem('study_app_credits') || '0');
}

// Update credits display in header
export function updateCreditsDisplay() {
  const credits = getUserCredits();

  // Find or create credits display element
  let creditsElement = document.getElementById('credits-display');

  if (!creditsElement) {
    // Create credits display element
    creditsElement = document.createElement('div');
    creditsElement.id = 'credits-display';
    creditsElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
    `;

    document.body.appendChild(creditsElement);
  }

  // Update credits display
  if (credits > 0) {
    creditsElement.innerHTML = `
      <span style="font-size: 18px;">💎</span>
      <span>${credits} Credits</span>
    `;
    creditsElement.style.display = 'flex';

    // Add pulse animation for new credits
    creditsElement.style.animation = 'pulse 0.5s ease-in-out';
  } else {
    creditsElement.style.display = 'none';
  }
}

// Show success popup
export function showSuccessPopup(paymentResult) {
  // Grant 10 credits for successful payment
  grantCredits(10);

  const popup = document.createElement('div');
  popup.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    ">
      <div style="
        background: white;
        padding: 40px;
        border-radius: 15px;
        text-align: center;
        max-width: 500px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      ">
        <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
        <h2 style="color: #4f46e5; margin-bottom: 15px;">Payment Successful!</h2>
        <p style="color: #666; margin-bottom: 20px;">
          Your StudyApp Starter Pack has been activated successfully.
        </p>
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order ID:</strong> ${paymentResult.order_id}</p>
          <p><strong>Amount:</strong> ${paymentResult.currency} ${paymentResult.amount}</p>
          <p style="color: #4f46e5; font-weight: bold;">💎 10 Credits Added!</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #4f46e5;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 20px;
        ">
          Start Learning! 🚀
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
}

// Show failure popup
export function showFailurePopup(paymentResult) {
  const popup = document.createElement('div');
  popup.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    ">
      <div style="
        background: white;
        padding: 40px;
        border-radius: 15px;
        text-align: center;
        max-width: 500px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      ">
        <div style="font-size: 60px; margin-bottom: 20px;">❌</div>
        <h2 style="color: #dc2626; margin-bottom: 15px;">Payment Failed</h2>
        <p style="color: #666; margin-bottom: 20px;">
          Your payment could not be processed. Please try again.
        </p>
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Status:</strong> ${paymentResult.status}</p>
          <p><strong>Order ID:</strong> ${paymentResult.order_id}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #dc2626;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 20px;
        ">
          Try Again
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
}

// Show error popup
export function showErrorPopup() {
  const popup = document.createElement('div');
  popup.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    ">
      <div style="
        background: white;
        padding: 40px;
        border-radius: 15px;
        text-align: center;
        max-width: 500px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      ">
        <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
        <h2 style="color: #f59e0b; margin-bottom: 15px;">Verification Error</h2>
        <p style="color: #666; margin-bottom: 20px;">
          We couldn't verify your payment status. Please contact support.
        </p>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #f59e0b;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 20px;
        ">
          Contact Support
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
}

// Test function to manually grant credits (for testing purposes)
// You can call this in browser console: window.testGrantCredits()
export function testGrantCredits() {
  grantCredits(10);
  console.log('🧪 Test: 10 credits granted manually');
}

// Clear stuck payment state (for fixing current issue)
export function clearPaymentState() {
  localStorage.removeItem('pending_order_id');
  localStorage.removeItem('processed_orders');
  console.log('🧹 Payment state cleared - no more popups will appear');
}

// Make test functions available globally for console testing
if (typeof window !== 'undefined') {
  window.testGrantCredits = testGrantCredits;
  window.clearPaymentState = clearPaymentState;
}
