import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post(
        `/auth/reset-password/${token}`,
        { password }
      );

      setSuccess(
        data.message ||
          'Password reset successful. Please login.'
      );

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Password reset failed. The link may be invalid or expired.'
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

        <h2>Create a new password.</h2>

        <p>
          Choose a strong password to keep your ExpenseAI
          account secure.
        </p>

        <div className="auth-points">
          <span>Minimum 6 characters</span>
          <span>Secure password reset</span>
          <span>Reset link expires in 15 minutes</span>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <h1>Reset password 🔐</h1>

          <p className="subtitle">
            Enter and confirm your new password.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New password</label>

              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>

            <div className="form-group">
              <label>Confirm password</label>

              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Enter password again"
              />
            </div>

            {error && (
              <p className="error-text">
                {error}
              </p>
            )}

            {success && (
              <p className="success-text">
                {success}
              </p>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Resetting...'
                : 'Reset password →'}
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