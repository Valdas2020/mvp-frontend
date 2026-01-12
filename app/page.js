'use client';
import { useState, useEffect } from 'react';

const deviceId =
  typeof window !== "undefined"
    ? (localStorage.getItem("device_id") ??
        (() => {
          const v = crypto.randomUUID();
          localStorage.setItem("device_id", v);
          return v;
        })())
    : null;

export default function AlphaPortal() {
  const [inviteCode, setInviteCode] = useState('');
  const [token, setToken] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = "https://mvp-backend-6r1j.onrender.com";

  // восстановление сессии
  useEffect(() => {
    const saved = localStorage.getItem('alpha_token');
    if (saved) {
      setToken(saved);
      fetchJobs(saved);
    }
  }, []);

  // автообновление списка задач (поллинг)
  useEffect(() => {
    if (!token) return;

    // Опрашиваем бэкенд каждые 5 секунд, если есть незавершенные задачи
    const interval = setInterval(() => {
      const hasPending = jobs.some(j => j.status === 'queued' || j.status === 'processing');
      if (hasPending || jobs.length === 0) {
        fetchJobs(token);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token, jobs]);

  // ---------- API ----------

  const loginWithInvite = async () => {
    if (!inviteCode) return;
    setLoading(true);

    const res = await fetch(`${API_URL}/api/auth/invite-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invite_code: inviteCode,
        device_id: deviceId,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data.detail || 'Invalid invite code');
      return;
    }

    localStorage.setItem('alpha_token', data.token);
    setToken(data.token);
    fetchJobs(data.token);
  };

  const fetchJobs = async (t) => {
    if (!t) return;
    try {
      const res = await fetch(`${API_URL}/api/jobs?token=${t}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (e) {
      console.error("Failed to fetch jobs", e);
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/api/upload?token=${token}`, {
      method: 'POST',
      body: formData,
    });

    setLoading(false);

    if (res.ok) {
      setFile(null);
      fetchJobs(token);
    } else {
      alert('Upload failed');
    }
  };

  const downloadJob = (id) => {
    window.location.href = `${API_URL}/api/jobs/${id}/download?token=${token}`;
  };

  // ---------- UI ----------

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-6 rounded-xl w-full max-w-md shadow">
          <h1 className="text-xl font-semibold mb-4 text-center">
            PDF Translator — Alpha
          </h1>

          <input
            className="w-full border p-3 mb-4 rounded"
            placeholder="Invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />

          <button
            onClick={loginWithInvite}
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded disabled:bg-slate-400"
          >
            {loading ? 'Вход…' : 'Войти'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center bg-slate-50 p-6">
      <div className="bg-white p-6 rounded-xl w-full max-w-xl shadow space-y-6">
        <h2 className="text-lg font-semibold">Загрузка книги</h2>

        <input
          type="file"
          accept=".pdf,.epub"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          onClick={uploadFile}
          disabled={loading || !file}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-slate-400"
        >
          {loading ? 'Загрузка…' : 'Загрузить'}
        </button>

        <div className="space-y-2">
          {jobs.map((j) => (
            <div
              key={j.id}
              className="flex flex-col border p-3 rounded bg-white shadow-sm"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium truncate max-w-[200px]">{j.filename}</span>
                {j.status === 'completed' && (
                  <button
                    onClick={() => downloadJob(j.id)}
                    className="text-blue-600 text-sm font-bold hover:underline"
                  >
                    Скачать
                  </button>
                )}
              </div>
              
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  {j.status === 'queued' && (
                    <span className="flex items-center gap-1">⏳ В очереди</span>
                  )}
                  {j.status === 'processing' && (
                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                      🔄 Переводится... {j.word_count > 0 ? `(стр. ${j.word_count})` : ''}
                    </span>
                  )}
                  {j.status === 'completed' && (
                    <span className="flex items-center gap-1 text-green-600">✅ Готово ({j.word_count} стр.)</span>
                  )}
                  {j.status === 'failed' && (
                    <span className="flex items-center gap-1 text-red-600 font-bold">❌ Ошибка</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">
                  {j.created_at ? new Date(j.created_at).toLocaleTimeString() : ''}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
