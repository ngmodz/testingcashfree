import React, { useEffect } from 'react'
import { handleStarterPackClick, checkForPaymentCompletion, updateCreditsDisplay } from '../utils/paymentHandler'

const Hero: React.FC = () => {
  // Check for payment completion and initialize credits display when component loads
  useEffect(() => {
    checkForPaymentCompletion();
    updateCreditsDisplay(); // Show credits if user already has them
  }, []);

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title">
            Master Your Learning with <span className="highlight">StudyApp</span>
          </h1>
          <p className="hero-subtitle">
            Transform the way you study with our intelligent flashcards, progress tracking, 
            and personalized learning paths. Achieve your academic goals faster and more effectively.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary btn-large">Start Learning Free</button>
            <button
              onClick={handleStarterPackClick}
              className="btn btn-outline btn-large"
            >
              Starter Pack
            </button>
            <a
              href="https://payments.cashfree.com/forms?code=starterpack"
              target="_parent"
              className="btn btn-outline btn-large btn-pro"
            >
              Starter Pack Pro
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Active Students</span>
            </div>
            <div className="stat">
              <span className="stat-number">1M+</span>
              <span className="stat-label">Cards Studied</span>
            </div>
            <div className="stat">
              <span className="stat-number">95%</span>
              <span className="stat-label">Success Rate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
