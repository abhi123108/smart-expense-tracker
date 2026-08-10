const badgeClass = (category) => `badge badge-${category.toLowerCase()}`;

export default function ExpenseList({ expenses, onDelete }) {
  if (!expenses || expenses.length === 0) {
    return <div className="empty-state"><div className="empty-icon">₹</div><strong>No transactions yet</strong><span>Add your first expense to start seeing insights.</span></div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th>Method</th><th>Amount</th>{onDelete && <th />}</tr></thead>
        <tbody>
          {expenses.map((exp) => (
            <tr key={exp._id}>
              <td><div className="expense-title"><span>{exp.title}</span>{exp.source === 'ocr' && <span title="Added via OCR scan">▣</span>}</div></td>
              <td><span className={badgeClass(exp.category)}>{exp.category}</span></td>
              <td>{new Date(exp.date).toLocaleDateString('en-IN')}</td>
              <td><span className="expense-method">{exp.paymentMethod || '-'}</span></td>
              <td className="amount-cell">₹{Number(exp.amount).toLocaleString('en-IN')}</td>
              {onDelete && <td><button className="btn btn-danger btn-sm" onClick={() => onDelete(exp._id)}>Delete</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
