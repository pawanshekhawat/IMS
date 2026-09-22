import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
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

  const handleQuickFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
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
          padding: '32px 28px 24px',
          color: '#FFFFFF',
          textAlign: 'center',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
            <Sparkles size={28} color="var(--color-tertiary-500)" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            Garhwal Lights
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-primary-100)', marginTop: '4px', margin: '4px 0 0' }}>
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

          {/* One-Click Quick Fill Helper */}
          <div style={{
            marginTop: '26px',
            paddingTop: '20px',
            borderTop: '1px solid var(--color-neutral-250)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-neutral-600)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              <ShieldCheck size={14} color="var(--color-primary-800)" />
              <span>Quick Login:</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--color-neutral-150)',
                  border: '1px solid var(--color-neutral-300)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-neutral-800)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-neutral-250)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-neutral-150)'}
              >
                <div style={{ fontWeight: 700, color: 'var(--color-primary-900)' }}>Admin</div>
                <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>Full Showroom Access</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('staff', 'staff123')}
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--color-neutral-150)',
                  border: '1px solid var(--color-neutral-300)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-neutral-800)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-neutral-250)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-neutral-150)'}
              >
                <div style={{ fontWeight: 700, color: 'var(--color-neutral-900)' }}>Staff</div>
                <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>Billing & Counter POS</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
