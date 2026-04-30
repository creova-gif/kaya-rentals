import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Zap, Mail, Lock, User, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ErrorHandler } from '../utils/errorHandling';

const G = '#0A7A52';
const BG = '#F8F7F4';
const TEXT = '#0E0F0C';
const MUTED = '#767570';
const BORDER = 'rgba(0,0,0,0.07)';

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp: authSignUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'landlord' | 'tenant' | 'contractor'>('landlord');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate password
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const result = await authSignUp(email, password, name, role);

      if (result.success) {
        setSuccess(true);
        ErrorHandler.success('Account created!', 'Redirecting to dashboard...');
        const destination = role === 'tenant' ? '/tenant' : role === 'contractor' ? '/app/contractor-marketplace' : '/app';
        setTimeout(() => {
          navigate(destination);
        }, 1500);
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: BG, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        padding: '20px',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: '#fff',
            borderRadius: 24,
            padding: '48px',
            maxWidth: 440,
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: `1px solid ${BORDER}`,
            textAlign: 'center',
          }}
        >
          <div style={{ 
            width: 64, 
            height: 64, 
            borderRadius: '50%', 
            background: '#E5F4EE', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: 24,
          }}>
            <CheckCircle size={32} color={G} />
          </div>
          <h2 style={{ 
            fontFamily: "'Instrument Serif', serif", 
            fontSize: 28, 
            fontWeight: 400, 
            color: TEXT,
            marginBottom: 12,
          }}>
            Account created!
          </h2>
          <p style={{ fontSize: 14, color: MUTED, marginBottom: 24 }}>
            Redirecting you to dashboard...
          </p>
          <Loader2 size={24} color={G} style={{ animation: 'spin 1s linear infinite' }} />
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: BG, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      padding: '20px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: '48px',
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: `1px solid ${BORDER}`,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            width: 64, 
            height: 64, 
            borderRadius: 16, 
            background: G, 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Zap size={32} color="#fff" />
          </div>
          <h1 style={{ 
            fontFamily: "'Instrument Serif', serif", 
            fontSize: 32, 
            fontWeight: 400, 
            color: TEXT,
            marginBottom: 8,
          }}>
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: MUTED }}>
            Join KAYA and modernize your rental business
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              background: '#FDECEA',
              border: '1px solid #C0392B',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 24,
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={18} color="#C0392B" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: '#C0392B', lineHeight: 1.5 }}>{error}</p>
          </motion.div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 600, 
              color: TEXT,
              marginBottom: 8,
            }}>
              I am a...
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {(['landlord', 'tenant', 'contractor'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    padding: '12px',
                    border: `2px solid ${role === r ? G : BORDER}`,
                    background: role === r ? '#E5F4EE' : '#fff',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    color: role === r ? G : TEXT,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                    textTransform: 'capitalize',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 600, 
              color: TEXT,
              marginBottom: 8,
            }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User 
                size={18} 
                color={MUTED} 
                style={{ 
                  position: 'absolute', 
                  left: 14, 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }} 
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 44px',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = G}
                onBlur={(e) => e.target.style.borderColor = BORDER}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 600, 
              color: TEXT,
              marginBottom: 8,
            }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail 
                size={18} 
                color={MUTED} 
                style={{ 
                  position: 'absolute', 
                  left: 14, 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }} 
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 44px',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = G}
                onBlur={(e) => e.target.style.borderColor = BORDER}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 600, 
              color: TEXT,
              marginBottom: 8,
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={18} 
                color={MUTED} 
                style={{ 
                  position: 'absolute', 
                  left: 14, 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }} 
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 44px',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = G}
                onBlur={(e) => e.target.style.borderColor = BORDER}
              />
            </div>
            <p style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>
              Minimum 6 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? MUTED : G,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#096644')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.background = G)}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        {/* Terms */}
        <p style={{ fontSize: 11, color: MUTED, textAlign: 'center', marginTop: 20 }}>
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>

        {/* Divider */}
        <div style={{ 
          margin: '32px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
          <span style={{ fontSize: 12, color: MUTED }}>or</span>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
        </div>

        {/* Login Link */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: MUTED }}>
            Already have an account?{' '}
            <a
              onClick={() => navigate('/login')}
              style={{
                color: G,
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              Sign in
            </a>
          </p>
        </div>

        {/* Back to Home */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a
            onClick={() => navigate('/')}
            style={{
              fontSize: 13,
              color: MUTED,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            ← Back to home
          </a>
        </div>
      </motion.div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}