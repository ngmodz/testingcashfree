import React from 'react'

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="nav">
          <div className="logo">
            <h1>📚 StudyApp</h1>
          </div>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="auth-buttons">
            <button className="btn btn-secondary">Sign In</button>
            <button className="btn btn-primary">Get Started</button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
