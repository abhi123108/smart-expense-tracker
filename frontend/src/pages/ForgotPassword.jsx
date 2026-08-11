import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', {
        email,
      });

      setMessage(
        data.message ||
          'If an account exists with this email, a password reset link has been sent.'
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to process your request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-brand">
          <div className="brand-mark">₹</div> ExpenseAI
        </div>

        <h2>Get back into your account.</h2>

        <p>
          Enter your registered email address and we will send
          you a secure password reset link.
        </p>

        <div className="auth-points">
          <span>Secure password recovery</span>
          <span>Reset link expires in 15 minutes</span>
          <span>Your account stays protected</span>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <h1>Forgot password?</h1>

          <p className="subtitle">
            Enter your email to receive a reset link.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <p className="error-text">
                {error}
              </p>
            )}

            {message && (
              <p className="success-text">
                {message}
              </p>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Sending...'
                : 'Send reset link →'}
            </button>
          </form>

          <p className="auth-footer">
            Remember your password?{' '}
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}