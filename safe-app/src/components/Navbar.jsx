import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ openModal }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route navigation
  const handleNavClick = (action) => {
    setIsMobileMenuOpen(false);
    action();
  };

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-content">
        <div className="navbar-logo">
          <span className="logo-text">S.A.F.E.</span>
        </div>
        
        {/* Mobile hamburger button */}
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          id="mobile-menu-toggle"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop menu */}
        <ul className="navbar-menu desktop-menu">
          <li>
            <button className="nav-btn active" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              Home
            </button>
          </li>
          <li>
            <button className="nav-btn" onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Features
            </button>
          </li>
          <li>
            <button className="nav-btn" onClick={() => document.getElementById('food-guide-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Food Guide
            </button>
          </li>
          <li>
            <button className="nav-btn" onClick={() => document.getElementById('articles-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Articles
            </button>
          </li>
        </ul>
      </div>

      {/* Mobile slide-down menu */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
          <ul className="mobile-menu-list">
            <li>
              <button className="mobile-nav-btn" onClick={() => handleNavClick(() => window.scrollTo({top: 0, behavior: 'smooth'}))}>
                🏠 Home
              </button>
            </li>
            <li>
              <button className="mobile-nav-btn" onClick={() => handleNavClick(() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' }))}>
                ✨ Features
              </button>
            </li>
            <li>
              <button className="mobile-nav-btn" onClick={() => handleNavClick(() => document.getElementById('food-guide-section')?.scrollIntoView({ behavior: 'smooth' }))}>
                🥗 Food Guide
              </button>
            </li>
            <li>
              <button className="mobile-nav-btn" onClick={() => handleNavClick(() => document.getElementById('articles-section')?.scrollIntoView({ behavior: 'smooth' }))}>
                📰 Articles
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
