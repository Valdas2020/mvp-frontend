'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

// ВАЖНО: Замени на URL своего API на Render (без слэша в конце)
// Например: https://mvp-backend.onrender.com
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; 

export default function Home() {
  const [step, setStep] = useState('login'); // login, verify, dashboard
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [file, setFile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Send OTP
  const handleSendOtp = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/send-otp?email=${email}`);
      setStep('verify');
    } catch (e) {
      alert('Error sending OTP. Check email.');
    }
    setLoading(false);
  };

  // 2. Verify OTP
  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/verify-otp?email=${email}&code=${otp}`);
      setToken(res.data.token);
      setUser(res.data.user);
      setStep('dashboard');
      fetchJobs(res.data.token);
    } catch (e) {
      alert('Invalid code');
    }
    setLoading(false);
  };

  // 3. Activate Invite
  const handleActivate = async () => {
    try {
      const res = await axios.post(`${API_URL}/users/activate-invite?token=${token}&code=${inviteCode}`);
      setUser({ ...user, plan: res.data.plan });
      alert('Plan activated!');
    } catch (e) {
      alert('Invalid or used code');
    }
  };

  // 4. Upload File
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('token', token);
    
    try {
      await axios.post(`${API_URL}/jobs/upload`, formData);
      alert('Book uploaded! Processing started.');
      fetchJobs(token);
    } catch (e) {
      alert('Upload failed');
    }
    setLoading(false);
  };

  // 5. Fetch Jobs
  const fetchJobs = async (t) => {
    try {
      const res = await axios.get(`${API_URL}/jobs?token=${t}`);
      setJobs(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // 6. Download
  const handleDownload = async (jobId) => {
    try {
      const res = await axios.get(`${API_URL}/jobs/${jobId}/download?token=${token}`);
      window.open(res.data.url, '_blank');
    } catch (e) {
      alert('File not ready yet');
    }
  };

  // Auto-refresh jobs
  useEffect(() => {
    if (step === 'dashboard') {
      const interval = setInterval(() => fetchJobs(token), 5000);
      return () => clearInterval(interval);
    }
  }, [step, token]);

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-6">AI Book Translator MVP</h1>

      {step === 'login' && (
        <div>
          <p className="mb-4">Enter your email to login or sign up.</p>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <button onClick={handleSendOtp} disabled={loading}>
            {loading ? 'Sending...' : 'Send Code'}
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div>
          <p className="mb-4">Enter the code sent to {email}</p>
          <input placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} />
          <button onClick={handleVerifyOtp} disabled={loading}>
            {loading ? 'Verifying...' : 'Login'}
          </button>
        </div>
      )}

      {step === 'dashboard' && user && (
        <div>
          <div className="mb-8 p-4 bg-gray-50 rounded">
            <p><strong>User:</strong> {user.email}</p>
            <p><strong>Plan:</strong> {user.plan || "No active plan"}</p>
            
            {!user.plan && (
              <div className="mt-4">
                <p className="text-sm text-red-600 mb-2">Activate a plan to start translating.</p>
                <input placeholder="Invite Code (e.g. START_S_20)" value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
                <button onClick={handleActivate}>Activate Plan</button>
              </div>
            )}
          </div>

          {user.plan && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Upload Book (PDF/EPUB)</h2>
              <input type="file" onChange={e => setFile(e.target.files[0])} />
              <button onClick={handleUpload} disabled={loading}>
                {loading ? 'Uploading...' : 'Translate Book'}
              </button>
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold mb-4">My Translations</h2>
            {jobs.length === 0 && <p className="text-gray-500">No jobs yet.</p>}
            {jobs.map(job => (
              <div key={job.id} className="border p-4 mb-2 rounded flex justify-between items-center">
                <div>
                  <p className="font-bold">{job.input_filename}</p>
                  <span className={`status-badge status-${job.status}`}>{job.status}</span>
                  <span className="text-xs text-gray-400 ml-2">{new Date(job.created_at).toLocaleString()}</span>
                </div>
                {job.status === 'done' && (
                  <button 
                    onClick={() => handleDownload(job.id)}
                    className="w-auto px-4 py-1 mb-0 bg-green-600 hover:bg-green-700"
                  >
                    Download
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
