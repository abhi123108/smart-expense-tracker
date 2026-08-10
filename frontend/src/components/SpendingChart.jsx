import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';

const COLORS = ['#4f46e5', '#7c3aed', '#db2777', '#dc2626', '#d97706', '#16a34a', '#0891b2', '#4338ca', '#be185d', '#6b7280'];

export function CategoryPieChart({ data }) {
  if (!data || data.length === 0) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No expense data yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={(entry) => entry.category}
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `₹${value}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DailyTrendChart({ data }) {
  if (!data || data.length === 0) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No data for this period</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip formatter={(value) => `₹${value}`} />
        <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyTrendLine({ data }) {
  if (!data || data.length === 0) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Not enough history yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip formatter={(value) => `₹${value}`} />
        <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
