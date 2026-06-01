import React, { useState } from 'react';

export default function LoginScreen({ API_BASE_URL, onLoginSuccess }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    // Client-side validations
    if (username.trim().length < 3) {
      setErrorMsg("Username must be at least 3 characters.");
      setLoading(false);
      return;
    }
    if (password.length < 4) {
      setErrorMsg("Password must be at least 4 characters.");
      setLoading(false);
      return;
    }

    if (!isLoginTab && password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLoginTab ? '/auth/login' : '/auth/register';
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication request failed.");
      }

      if (isLoginTab) {
        onLoginSuccess({
          username: data.username,
          token: data.access_token
        });
      } else {
        // Automatically switch to login tab after successful registration
        setIsLoginTab(true);
        setPassword('');
        setConfirmPassword('');
        setErrorMsg("Account registered successfully! You can now log in.");
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100%',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Blur Spheres */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '25%',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, hsla(263, 90%, 66%, 0.15) 0%, transparent 70%)',
        filter: 'blur(30px)',
        zIndex: -1
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '25%',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, hsla(160, 84%, 39%, 0.1) 0%, transparent 70%)',
        filter: 'blur(30px)',
        zIndex: -1
      }} />

      <div className="modal-content" style={{ 
        maxWidth: '420px', 
        animation: 'slideUp 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.15) forwards',
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        backdropFilter: 'blur(16px)',
        boxShadow: 'var(--shadow-lg), var(--shadow-glow)'
      }}>
        {/* Logo and Branding */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg style={{ width: '36px', height: '36px', color: 'var(--color-accent)', filter: 'drop-shadow(0 0 8px var(--color-accent))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="logo-text" style={{ fontSize: '1.65rem' }}>FlowStock</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>
            Advanced Inventory & Order Ledger Control
          </p>
        </div>

        {/* Tab Headers */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '8px', 
          backgroundColor: 'var(--bg-primary)',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid var(--card-border)',
          marginBottom: '24px'
        }}>
          <button 
            type="button" 
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'var(--transition-fast)',
              backgroundColor: isLoginTab ? 'var(--card-bg)' : 'transparent',
              color: isLoginTab ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
            onClick={() => {
              setIsLoginTab(true);
              setErrorMsg('');
            }}
          >
            Sign In
          </button>
          <button 
            type="button" 
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'var(--transition-fast)',
              backgroundColor: !isLoginTab ? 'var(--card-bg)' : 'transparent',
              color: !isLoginTab ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
            onClick={() => {
              setIsLoginTab(false);
              setErrorMsg('');
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Error/Feedback Toast inside Panel */}
        {errorMsg && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 500,
            marginBottom: '20px',
            backgroundColor: errorMsg.includes("successfully") ? 'hsla(160, 84%, 39%, 0.15)' : 'hsla(350, 89%, 60%, 0.15)',
            border: `1px solid ${errorMsg.includes("successfully") ? 'var(--color-success)' : 'var(--color-danger)'}`,
            color: errorMsg.includes("successfully") ? 'hsl(160, 84%, 80%)' : 'hsl(350, 89%, 80%)'
          }}>
            {errorMsg}
          </div>
        )}

        {/* Interactive Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              required 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {!isLoginTab && (
            <div className="form-group" style={{ animation: 'fadeIn 0.2s ease forwards' }}>
              <label className="form-label">Confirm Password</label>
              <input 
                type="password" 
                className="form-input" 
                required 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '16px', height: '42px' }}
            disabled={loading}
          >
            {loading ? "Authenticating..." : isLoginTab ? "Access Terminal" : "Register Control Profile"}
          </button>
        </form>

        {/* Default Help Notice */}
        {isLoginTab && (
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Demo Terminal User: <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>admin</span> | Password: <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>admin123</span>
          </div>
        )}
      </div>
    </div>
  );
}
