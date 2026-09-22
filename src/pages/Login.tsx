import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both User ID and Password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await login(username, password);
      if (res.success) {
        // Direct to appropriate starting page based on username/role
        const cleanUser = username.trim().toLowerCase();
        if (cleanUser === 'admin') {
          navigate('/');
        } else {
          navigate('/sales');
        }
      } else {
        setError(res.error || 'Authentication failed. Please check your credentials.');
      }
    } catch {
      setError('An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-neutral-200)',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-neutral-300)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.02)',
        overflow: 'hidden',
      }}>
        {/* Top Decorative Brand Bar */}
        <div style={{
          backgroundColor: 'var(--color-primary-800)',
          padding: '28px 24px 22px',
          color: '#FFFFFF',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <img
            src="/garhwal-lights-logo-trns.png"
            alt="Garhwal Lights"
            style={{
              height: '72px',
              maxWidth: '180px',
              objectFit: 'contain',
              marginBottom: '10px',
              filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.25))',
            }}
          />
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            Garhwal Lights
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--color-primary-100)', marginTop: '4px', margin: '4px 0 0' }}>
            Retail Showroom • Shivam Heights, Sikar
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '32px 28px' }}>
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-neutral-900)', margin: '0 0 4px' }}>
              Sign In to System
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--color-neutral-500)', margin: 0 }}>
              Enter your user credentials to access your store portal
            </p>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              border: '1px solid #fca5a5',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '20px',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* User ID Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-neutral-800)',
                marginBottom: '6px',
              }}>
                User ID
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  color="var(--color-neutral-500)"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="Enter User ID (e.g. admin or staff)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  className="input-base"
                  style={{
                    paddingLeft: '38px',
                    height: '42px',
                    fontSize: '13px',
                    backgroundColor: 'var(--color-neutral-100)',
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-neutral-800)',
                marginBottom: '6px',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color="var(--color-neutral-500)"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base"
                  style={{
                    paddingLeft: '38px',
                    paddingRight: '42px',
                    height: '42px',
                    fontSize: '13px',
                    backgroundColor: 'var(--color-neutral-100)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-neutral-500)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: '8px' }}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                icon={<ArrowRight size={16} color="#FFFFFF" />}
                iconPosition="right"
                style={{ width: '100%', height: '44px' }}
              >
                Sign In
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
