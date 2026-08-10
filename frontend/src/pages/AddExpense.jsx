import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Groceries', 'Rent', 'Education', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'NetBanking', 'Other'];
const icons = { Food:'🍴', Transport:'🚗', Shopping:'🛍', Bills:'📄', Entertainment:'🎬', Health:'❤️', Groceries:'🛒', Rent:'🏠', Education:'🎓', Other:'•' };

export default function AddExpense() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title:'', amount:'', category:'Food', date:new Date().toISOString().slice(0,10), paymentMethod:'UPI', notes:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await api.post('/expenses', { ...form, amount:Number(form.amount) }); navigate('/'); }
    catch (err) { setError(err.response?.data?.message || 'Failed to add expense'); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <div className="page-header"><div><h1>Add expense</h1><p>Record a transaction in a few seconds.</p></div></div>
      <div className="page-split">
        <div className="card">
          <div className="panel-heading"><div><h3>Expense details</h3><div className="muted">All fields are saved securely to your account.</div></div></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>What did you spend on?</label><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Lunch at Cafe" /></div>
            <div className="grid grid-2">
              <div className="form-group"><label>Amount (₹)</label><input type="number" required min="0" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00" /></div>
              <div className="form-group"><label>Date</label><input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
            </div>
            <div className="grid grid-2">
              <div className="form-group"><label>Category</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.map(c=><option key={c} value={c}>{icons[c]} {c}</option>)}</select></div>
              <div className="form-group"><label>Payment method</label><select value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}>{PAYMENT_METHODS.map(p=><option key={p}>{p}</option>)}</select></div>
            </div>
            <div className="form-group"><label>Notes <span style={{fontWeight:400,color:'var(--text-light)'}}>(optional)</span></label><textarea rows={4} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Add a note about this expense..." /></div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-primary btn-inline" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save expense →'}</button>
          </form>
        </div>
        <div className="card">
          <h3>Quick tips</h3>
          <div className="tip-list">
            <div><b>Be specific</b><span>Use a clear title like “Lunch at Green Cafe”.</span></div>
            <div><b>Pick the right category</b><span>Better categories make reports and AI predictions more useful.</span></div>
            <div><b>Use OCR</b><span>Have a receipt? Scan it instead of typing everything manually.</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
