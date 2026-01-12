import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  
  // Create refs for scroll animations
  const statsSection = useScrollAnimation();
  const benefitsSection = useScrollAnimation();
  const ctaSection = useScrollAnimation();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  if (isAuthenticated) {
    return null; // Don't show landing page if user is logged in
  }

  return (
    <div className="landing-page">
      {/* Premium Hero Section */}
      <section className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Background Effects */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 50%, #f0f9ff 100%)',
          zIndex: 0
        }} />

        {/* Animated gradient orbs */}
        <div style={{
          position: 'absolute',
          top: '-200px',
          right: '-200px',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(6, 182, 212, 0.2) 100%)',
          animation: 'float 8s ease-in-out infinite',
          zIndex: 0
        }} />

        <div style={{
          position: 'absolute',
          bottom: '-150px',
          left: '-150px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
          animation: 'float 10s ease-in-out infinite 1s',
          zIndex: 0
        }} />

        <div className="hero-content" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="hero-title" style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🌱 GreenRoute
          </h1>
          <p className="hero-subtitle" style={{
            fontSize: '1.5rem',
            color: '#475569',
            marginBottom: '2rem',
            fontWeight: 500,
            maxWidth: '600px'
          }}>
            Navigate sustainably. Share rides. Reduce your carbon footprint with every journey.
          </p>
          <div className="hero-buttons" style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
            <Link to="/login" className="btn-premium-primary" style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              textDecoration: 'none',
              minWidth: '180px',
              textAlign: 'center'
            }}>
              🚀 Get Started
            </Link>
            <Link to="/signup" className="btn-premium-secondary" style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              textDecoration: 'none',
              minWidth: '180px',
              textAlign: 'center'
            }}>
              Create Account
            </Link>
          </div>
          <div className="hero-navigation" style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
            <button 
              onClick={() => scrollToSection('about-section')}
              style={{
                background: 'none',
                border: 'none',
                color: '#10b981',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'none'}
            >
              ↓ Learn More
            </button>
          </div>
        </div>

        {/* Premium Feature Cards */}
        <div className="hero-visual" style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginTop: '3rem'
        }}>
          <div className="premium-card" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 20px 50px rgba(16, 185, 129, 0.25)';
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.07)';
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
          }}>
            <div style={{
              fontSize: '2.5rem',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              transition: 'transform 0.3s ease',
              display: 'inline-block'
            }}
            className="feature-icon">🗺️</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Smart Routing</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Find the most eco-friendly routes optimized for sustainability</p>
          </div>

          <div className="premium-card" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 20px 50px rgba(59, 130, 246, 0.25)';
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.07)';
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
          }}>
            <div style={{
              fontSize: '2.5rem',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              transition: 'transform 0.3s ease',
              display: 'inline-block'
            }}
            className="feature-icon">🌍</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Carbon Tracking</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Monitor and visualize your environmental impact in real-time</p>
          </div>

          <div className="premium-card" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 20px 50px rgba(249, 115, 22, 0.25)';
            e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.07)';
            e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)';
          }}>
            <div style={{
              fontSize: '2.5rem',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>📊</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Eco Scores</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Compare routes by sustainability and earn eco-friendly badges</p>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          
          .stat-icon {
            display: inline-block;
            animation: pulse 2s ease-in-out infinite;
          }
          
          .premium-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15);
          }
        `}</style>
      </section>

      {/* Statistics Section */}
      <section 
        ref={statsSection.ref}
        style={{
          padding: '5rem 2rem',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)',
          borderTop: '1px solid rgba(16, 185, 129, 0.1)',
          opacity: statsSection.isVisible ? 1 : 0,
          transform: statsSection.isVisible ? 'translateY(0)' : 'translateY(40px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease'
        }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            fontWeight: 800,
            marginBottom: '3rem',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Making a Real Impact</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{ 
              textAlign: 'center',
              opacity: statsSection.isVisible ? 1 : 0,
              transform: statsSection.isVisible ? 'translateY(0)' : 'translateY(40px)',
              transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s, background 0.3s ease, box-shadow 0.3s ease, padding 0.3s ease',
              padding: '1.5rem',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.2)';
              e.currentTarget.style.transform = 'scale(1.05) translateY(-8px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }} className="stat-icon">👥</div>
              <div style={{
                fontSize: '3rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem'
              }}>
                12,480+
              </div>
              <div style={{ color: '#64748b', fontWeight: 600 }}>Active Users</div>
            </div>
            <div style={{ 
              textAlign: 'center',
              opacity: statsSection.isVisible ? 1 : 0,
              transform: statsSection.isVisible ? 'translateY(0)' : 'translateY(40px)',
              transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s, background 0.3s ease, box-shadow 0.3s ease, padding 0.3s ease',
              padding: '1.5rem',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.transform = 'scale(1.05) translateY(-8px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }} className="stat-icon">🚗</div>
              <div style={{
                fontSize: '3rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem'
              }}>
                68,210+
              </div>
              <div style={{ color: '#64748b', fontWeight: 600 }}>Eco Trips Completed</div>
            </div>
            <div style={{ 
              textAlign: 'center',
              opacity: statsSection.isVisible ? 1 : 0,
              transform: statsSection.isVisible ? 'translateY(0)' : 'translateY(40px)',
              transition: 'opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s, background 0.3s ease, box-shadow 0.3s ease, padding 0.3s ease',
              padding: '1.5rem',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.2)';
              e.currentTarget.style.transform = 'scale(1.05) translateY(-8px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }} className="stat-icon">🌱</div>
              <div style={{
                fontSize: '3rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem'
              }}>
                32.4 Tons
              </div>
              <div style={{ color: '#64748b', fontWeight: 600 }}>CO₂ Saved</div>
            </div>
            <div style={{ 
              textAlign: 'center',
              opacity: statsSection.isVisible ? 1 : 0,
              transform: statsSection.isVisible ? 'translateY(0)' : 'translateY(40px)',
              transition: 'opacity 0.6s ease 0.4s, transform 0.6s ease 0.4s, background 0.3s ease, box-shadow 0.3s ease, padding 0.3s ease',
              padding: '1.5rem',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(249, 115, 22, 0.2)';
              e.currentTarget.style.transform = 'scale(1.05) translateY(-8px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }} className="stat-icon">🌍</div>
              <div style={{
                fontSize: '3rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem'
              }}>
                28+
              </div>
              <div style={{ color: '#64748b', fontWeight: 600 }}>Cities Covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section 
        ref={benefitsSection.ref}
        style={{ 
          padding: '5rem 2rem', 
          background: 'white',
          opacity: benefitsSection.isVisible ? 1 : 0,
          transform: benefitsSection.isVisible ? 'translateY(0)' : 'translateY(40px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease'
        }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            fontWeight: 800,
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Why Choose GreenRoute?</h2>
          <p style={{
            textAlign: 'center',
            fontSize: '1.1rem',
            color: '#64748b',
            marginBottom: '3rem',
            maxWidth: '600px',
            margin: '0 auto 3rem'
          }}>Experience the perfect blend of sustainability and convenience</p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            <div className="premium-card" style={{
              padding: '2rem',
              textAlign: 'left',
              borderLeft: '4px solid #10b981',
              opacity: benefitsSection.isVisible ? 1 : 0,
              transform: benefitsSection.isVisible ? 'translateX(0)' : 'translateX(-40px)',
              transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s, background 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.15)';
              e.currentTarget.style.transform = 'translateX(8px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateX(0)';
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', transition: 'transform 0.3s ease' }} className="benefit-icon">💰</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1e293b' }}>Save Money</h3>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>Reduce fuel costs and vehicle maintenance by choosing optimized eco-friendly routes and ride-sharing options</p>
            </div>

            <div className="premium-card" style={{
              padding: '2rem',
              textAlign: 'left',
              borderLeft: '4px solid #3b82f6',
              opacity: benefitsSection.isVisible ? 1 : 0,
              transform: benefitsSection.isVisible ? 'translateX(0)' : 'translateX(-40px)',
              transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s, background 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.15)';
              e.currentTarget.style.transform = 'translateX(8px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateX(0)';
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', transition: 'transform 0.3s ease' }} className="benefit-icon">⚡</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1e293b' }}>Fast & Efficient</h3>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>AI-powered route optimization ensures you reach your destination quickly while minimizing environmental impact</p>
            </div>

            <div className="premium-card" style={{
              padding: '2rem',
              textAlign: 'left',
              borderLeft: '4px solid #8b5cf6',
              opacity: benefitsSection.isVisible ? 1 : 0,
              transform: benefitsSection.isVisible ? 'translateX(0)' : 'translateX(-40px)',
              transition: 'opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s, background 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.15)';
              e.currentTarget.style.transform = 'translateX(8px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateX(0)';
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', transition: 'transform 0.3s ease' }} className="benefit-icon">🔒</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1e293b' }}>Safe & Secure</h3>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>Verified drivers, secure payments, and real-time tracking for your peace of mind</p>
            </div>

            <div className="premium-card" style={{
              padding: '2rem',
              textAlign: 'left',
              borderLeft: '4px solid #10b981',
              opacity: benefitsSection.isVisible ? 1 : 0,
              transform: benefitsSection.isVisible ? 'translateX(0)' : 'translateX(-40px)',
              transition: 'opacity 0.6s ease 0.4s, transform 0.6s ease 0.4s, background 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(52, 211, 153, 0.05) 100%)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.15)';
              e.currentTarget.style.transform = 'translateX(8px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateX(0)';
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', transition: 'transform 0.3s ease' }} className="benefit-icon">🌿</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1e293b' }}>Eco-Friendly</h3>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>Track your carbon savings and contribute to a cleaner environment with every journey</p>
            </div>

            <div className="premium-card" style={{
              padding: '2rem',
              textAlign: 'left',
              borderLeft: '4px solid #f97316',
              opacity: benefitsSection.isVisible ? 1 : 0,
              transform: benefitsSection.isVisible ? 'translateX(0)' : 'translateX(-40px)',
              transition: 'opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s, background 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(251, 146, 60, 0.05) 100%)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(249, 115, 22, 0.15)';
              e.currentTarget.style.transform = 'translateX(8px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateX(0)';
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', transition: 'transform 0.3s ease' }} className="benefit-icon">📱</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1e293b' }}>Easy to Use</h3>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>Intuitive interface designed for seamless navigation and booking experience</p>
            </div>

            <div className="premium-card" style={{
              padding: '2rem',
              textAlign: 'left',
              borderLeft: '4px solid #ec4899',
              opacity: benefitsSection.isVisible ? 1 : 0,
              transform: benefitsSection.isVisible ? 'translateX(0)' : 'translateX(-40px)',
              transition: 'opacity 0.6s ease 0.6s, transform 0.6s ease 0.6s, background 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(244, 114, 182, 0.05) 100%)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(236, 72, 153, 0.15)';
              e.currentTarget.style.transform = 'translateX(8px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateX(0)';
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', transition: 'transform 0.3s ease' }} className="benefit-icon">🏆</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1e293b' }}>Earn Rewards</h3>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>Get eco-badges and exclusive rewards for sustainable travel choices</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        ref={ctaSection.ref}
        className="cta-section"
        style={{
          opacity: ctaSection.isVisible ? 1 : 0,
          transform: ctaSection.isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'opacity 0.8s ease, transform 0.8s ease'
        }}>
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Your Green Journey?</h2>
            <p>Join thousands of users making a positive environmental impact with every trip.</p>
            <div className="cta-buttons">
              <Link to="/login" className="btn btn-primary btn-large">
                🚀 Start Now
              </Link>
              <Link to="/signup" className="btn btn-outline btn-large">
                ✨ Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>🌱 GreenRoute</h3>
              <p>Navigating towards a sustainable future</p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '1.5rem' }}>
                <a href="#facebook" style={{ transition: 'transform 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>📘</a>
                <a href="#twitter" style={{ transition: 'transform 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>🐦</a>
                <a href="#instagram" style={{ transition: 'transform 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>📷</a>
                <a href="#linkedin" style={{ transition: 'transform 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>💼</a>
              </div>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>🎯 Product</h4>
                <a href="#features">✨ Features</a>
                <a href="#pricing">💎 Pricing</a>
                <a href="#download">📥 Download</a>
              </div>
              <div className="footer-column">
                <h4>🏢 Company</h4>
                <a href="#about">ℹ️ About</a>
                <a href="#careers">👔 Careers</a>
                <a href="#contact">📧 Contact</a>
              </div>
              <div className="footer-column">
                <h4>🛟 Support</h4>
                <a href="#help">❓ Help Center</a>
                <a href="#privacy">🔐 Privacy</a>
                <a href="#terms">📜 Terms</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 GreenRoute. All rights reserved. Made with 💚 for the planet</p>
          </div>
        </div>
      </footer>
      
      <style>{`
        .btn {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        
        .btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .btn:hover::before {
          width: 300px;
          height: 300px;
        }
        
        .btn-primary:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 12px 32px rgba(16, 185, 129, 0.35);
        }
        
        .btn-outline:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 12px 32px rgba(59, 130, 246, 0.35);
          background: rgba(59, 130, 246, 0.1);
        }
        
        .cta-buttons {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
          .cta-buttons {
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
