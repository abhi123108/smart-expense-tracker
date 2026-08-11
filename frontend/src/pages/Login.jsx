import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Login failed. Please try again.'
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

        <h2>Make every rupee count.</h2>

        <p>
          A smarter way to track expenses, understand spending
          patterns and build healthier monthly habits.
        </p>

        <div className="auth-points">
          <span>Track expenses in seconds</span>
          <span>Scan receipts with OCR</span>
          <span>Get AI-powered spending insights</span>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <h1>Welcome 👋</h1>

          <p className="subtitle">
            Sign in to your ExpenseAI workspace.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>

              <input
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                placeholder="you@example.com"
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                required
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
                placeholder="••••••••"
              />

              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <Link to="/forgot-password">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <p className="error-text">
                {error}
              </p>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Signing in...'
                : 'Sign in →'}
            </button>
          </form>

          <p className="auth-footer">
            New here?{' '}
            <Link to="/register">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}