export default function BudgetAlert({ alerts }) {
  if (!alerts || alerts.length === 0) return null;
  return <div style={{marginBottom:18}}>{alerts.map((a,idx)=><div key={idx} className={`alert ${a.level==='exceeded'?'alert-danger':'alert-warning'} budget-alert`}><span style={{fontSize:17}}>{a.level==='exceeded'?'⚠':'◔'}</span><span><strong>{a.message}</strong> · ₹{a.spent.toLocaleString('en-IN')} / ₹{a.limit.toLocaleString('en-IN')}</span></div>)}</div>;
}
