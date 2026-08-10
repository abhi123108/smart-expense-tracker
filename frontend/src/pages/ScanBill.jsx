import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const CATEGORIES = ['Food','Transport','Shopping','Bills','Entertainment','Health','Groceries','Rent','Education','Other'];

export default function ScanBill() {
  const navigate = useNavigate();
  const [file,setFile]=useState(null), [preview,setPreview]=useState(null), [scanning,setScanning]=useState(false), [saving,setSaving]=useState(false), [scanResult,setScanResult]=useState(null), [error,setError]=useState(''), [form,setForm]=useState(null);
  const handleFileChange=e=>{const selected=e.target.files[0];if(!selected)return;setFile(selected);setPreview(URL.createObjectURL(selected));setScanResult(null);setForm(null);setError('');};
  const handleScan=async()=>{if(!file)return;setScanning(true);setError('');try{const fd=new FormData();fd.append('bill',file);const {data}=await api.post('/ocr/scan',fd,{headers:{'Content-Type':'multipart/form-data'}});setScanResult(data);setForm({title:data.title,amount:data.amount,category:data.category,date:new Date(data.date).toISOString().slice(0,10),receiptImage:data.receiptImage,rawText:data.rawText,paymentMethod:'Card',notes:''});}catch(err){setError(err.response?.data?.message||'OCR scan failed. Try a clearer image.');}finally{setScanning(false);}};
  const handleConfirm=async()=>{setSaving(true);setError('');try{await api.post('/ocr/confirm',{...form,amount:Number(form.amount)});navigate('/');}catch(err){setError(err.response?.data?.message||'Failed to save expense');}finally{setSaving(false);}};
  const reset=()=>{setForm(null);setFile(null);setPreview(null);setScanResult(null);setError('');};
  return <div>
    <div className="page-header"><div><h1>Scan receipt</h1><p>Let OCR extract the details, then review before saving.</p></div></div>
    {!form && <div className="page-split">
      <div className="card">
        <label className="dropzone" htmlFor="bill-upload">
          {preview ? <img src={preview} alt="Receipt preview" style={{maxWidth:'100%',maxHeight:290,borderRadius:12,objectFit:'contain'}} /> : <div><div className="upload-icon">▣</div><strong style={{display:'block',color:'#42495a'}}>Upload a receipt</strong><p style={{margin:'7px 0 3px'}}>Click here to choose a bill image</p><small>JPG, PNG or WEBP · max 5MB</small></div>}
        </label>
        <input id="bill-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} style={{display:'none'}} />
        {file && <button className="btn btn-primary" style={{marginTop:16,width:'100%'}} onClick={handleScan} disabled={scanning}>{scanning?'Reading receipt with OCR...':'Scan receipt →'}</button>}
        {error && <p className="error-text">{error}</p>}
      </div>
      <div className="card"><h3>How it works</h3><div className="tip-list"><div><b>01 · Upload</b><span>Take a clear photo with the receipt fully visible.</span></div><div><b>02 · Extract</b><span>OCR identifies merchant, amount, date and category.</span></div><div><b>03 · Review</b><span>You can edit the extracted fields before saving.</span></div></div></div>
    </div>}
    {form && <div className="page-split">
      <div className="card"><div className="panel-heading"><div><h3>Review extracted expense</h3><div className="muted">Check the values before adding them.</div></div><span className="badge badge-other">OCR</span></div>
        {scanResult?.confidence==='low'&&<div className="alert alert-warning">⚠️ Low confidence. Please double-check the amount and merchant.</div>}
        <div className="form-group"><label>Merchant / title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
        <div className="grid grid-2"><div className="form-group"><label>Amount (₹)</label><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div><div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div></div>
        <div className="form-group"><label>Category</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
        {error&&<p className="error-text">{error}</p>}
        <div style={{display:'flex',gap:10}}><button className="btn btn-primary btn-inline" onClick={handleConfirm} disabled={saving}>{saving?'Saving...':'Confirm & save →'}</button><button className="btn btn-secondary" onClick={reset}>Scan another</button></div>
      </div>
      <div className="card"><h3>Receipt preview</h3>{preview&&<img src={preview} alt="Receipt" style={{width:'100%',maxHeight:420,objectFit:'contain',borderRadius:14,background:'#f6f7fb'}}/>}</div>
    </div>}
  </div>;
}
