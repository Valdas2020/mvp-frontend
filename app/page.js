'use client';
import { useState, useEffect } from 'react';

export default function AlphaPortal() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: App
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = "https://mvp-backend-6r1j.onrender.com";

  // restore session
  useEffect(() => {
    const saved = localStorage.getItem('alpha_token');
    if (saved) {
      setToken(saved);
      setStep(3);
      fetchJobs(saved);
    }
  }, []);

  // --- AUTH FLOW ---

  const requestOtp = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/api/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    setLoading(false);
    if (res.ok) setStep(2);
    else alert("Ошибка отправки OTP");
  };

  const verifyOtp = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setToken(data.token);
      localStorage.setItem('alpha_token', data.token);
      setStep(3);
      fetchJobs(data.token);
    } else {
      alert(data.detail || "Неверный код");
    }
  };

  // --- JOBS ---

  const fetchJobs = async (t) => {
    const res = await fetch(`${API_URL}/api/jobs?token=${t}`);
    const data = await res.json();
    setJobs(data.jobs || []);
  };

  const uploadFile = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/api/upload?token=${token}`, {
      method: 'POST',
      body: formData
    });

    setLoading(false);
    if (res.ok) {
      setFile(null);
      fetchJobs(token);
    } else {
      alert("Ошибка загрузки");
    }
  };

  const downloadJob = (id) => {
    window.location.href = `${API_URL}/api/jobs/${id}/download?token=${token}`;
  };

  // --- UI ---

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow">

        {step === 1 && (
          <>
            <h2 className="text-xl mb-4">Вход</h2>
            <input
              className="w-full border p-2 mb-4"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button onClick={requestOtp} disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded">
              Отправить код
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl mb-4">Введите код</h2>
            <input
              className="w-full border p-2 mb-4"
              placeholder="OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
            />
            <button onClick={verifyOtp} disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded">
              Войти
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <input type="file" onChange={e => setFile(e.target.files[0])} />
            <button onClick={uploadFile} disabled={loading} className="block mt-4 bg-blue-600 text-white p-2 rounded">
              Загрузить
            </button>

            <div className="mt-6 space-y-2">
              {jobs.map(j => (
                <div key={j.id} className="flex justify-between border p-2 rounded">
                  <span>{j.filename}</span>
                  {j.status === 'completed' && (
                    <button onClick={() => downloadJob(j.id)} className="text-blue-600">
                      Скачать
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
