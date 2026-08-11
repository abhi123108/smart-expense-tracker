import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await register(form.name, form.email, form.password);

      setSuccess('Registration successful. Please login.');

      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Registration failed. Please try again.'
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

        <h2>Turn spending into clarity.</h2>

        <p>
          Build a simple picture of your finances with beautiful
          dashboards, receipt scanning and practical AI insights.
        </p>

        <div className="auth-points">
          <span>One place for every transaction</span>
          <span>Budget alerts before overspending</span>
          <span>Reports that explain your habits</span>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <h1>Create your account ✨</h1>

          <p className="subtitle">
            Start tracking smarter with AI.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full name</label>

              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                placeholder="Your name"
              />
            </div>

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
                minLength={6}
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
                placeholder="At least 6 characters"
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
                ? 'Creating account...'
                : 'Create account →'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}