# StudyApp - Cashfree Payment Integration

A modern React application with automated Cashfree payment verification and credit management system.

## 🚀 Features

- **Automated Payment Verification** - Real-time payment status checking using Cashfree API
- **Credit Management System** - Automatic credit granting (10 credits per successful payment)
- **Production Ready** - Configured for production Cashfree environment
- **Smart Popup System** - Success/failure notifications with loop prevention
- **User Management** - Subscription tracking and access control
- **Modern UI** - Clean, responsive design with React + TypeScript

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Modern CSS** with responsive design
- **Payment Handler** with automatic verification

### Backend
- **Node.js** with Express
- **Cashfree API Integration** for payment verification
- **In-memory data storage** for user and payment tracking
- **CORS enabled** for frontend communication

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Cashfree production account with API keys

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/ngmodz/testingcashfree.git
cd testingcashfree
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd backend
npm install
```

4. **Configure environment variables**
```bash
# Create backend/.env file with your Cashfree production keys
CASHFREE_CLIENT_ID=your_production_client_id
CASHFREE_CLIENT_SECRET=your_production_secret_key
PORT=3001
NODE_ENV=production
```

## 🚀 Running the Application

### Development Mode

1. **Start the backend server**
```bash
cd backend
npm run dev
```

2. **Start the frontend (in a new terminal)**
```bash
npm run dev
```

3. **Open your browser**
```
Frontend: http://localhost:5173
Backend API: http://localhost:3001
```

## 💳 Payment Flow

1. **User clicks "Starter Pack"** button
2. **System creates payment record** with unique order ID
3. **User redirected** to Cashfree production payment form
4. **User completes payment** (real transaction)
5. **System automatically verifies** payment status via Cashfree API
6. **Credits granted** only for successful payments (10 credits)
7. **Success/failure popup** shows payment result

## 🔧 API Endpoints

### Backend Endpoints
- `GET /health` - Health check and configuration status
- `POST /api/create-payment` - Create new payment record
- `POST /api/verify-payment` - Verify payment status with Cashfree
- `GET /api/user-status/:userId` - Get user subscription status

## 🛡️ Security Features

- **Environment variables** for API keys (not committed to git)
- **Server-side verification** using Cashfree API
- **Production API endpoints** for real payment processing
- **Input validation** and error handling
- **CORS protection** configured

## 📱 Production Deployment

The application is configured for production use with:
- Production Cashfree API endpoints
- Real payment form integration
- Proper error handling and logging
- Security best practices

## 🧪 Testing

### Test Payment Verification
```bash
# Test backend health
curl http://localhost:3001/health

# Test payment verification
curl -X POST http://localhost:3001/api/verify-payment \
  -H "Content-Type: application/json" \
  -d '{"order_id":"test_order_123"}'
```

## 📄 License

This project is for testing Cashfree payment integration.

## 🤝 Contributing

This is a testing repository for Cashfree payment integration.
