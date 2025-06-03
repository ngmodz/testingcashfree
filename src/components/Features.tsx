import React from 'react'

const Features: React.FC = () => {
  const features = [
    {
      icon: '🧠',
      title: 'Smart Flashcards',
      description: 'AI-powered spaced repetition system that adapts to your learning pace and helps you remember more effectively.'
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Detailed analytics and insights into your study habits, performance trends, and areas for improvement.'
    },
    {
      icon: '🎯',
      title: 'Personalized Plans',
      description: 'Custom study schedules and learning paths tailored to your goals, timeline, and learning style.'
    },
    {
      icon: '👥',
      title: 'Study Groups',
      description: 'Collaborate with classmates, share study materials, and learn together in virtual study rooms.'
    },
    {
      icon: '📱',
      title: 'Mobile Learning',
      description: 'Study anywhere, anytime with our mobile app. Sync your progress across all devices seamlessly.'
    },
    {
      icon: '🏆',
      title: 'Achievements',
      description: 'Stay motivated with gamified learning, badges, streaks, and leaderboards to track your progress.'
    }
  ]

  return (
    <section id="features" className="features">
      <div className="container">
        <div className="section-header">
          <h2>Why Choose StudyApp?</h2>
          <p>Powerful features designed to supercharge your learning experience</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
