'use client';
import { useState, useEffect } from 'react';

export default function AlphaPortal() {
  const [step, setStep] = useState(1); // 1: Code, 2: Profile, 3: App
  const [inviteCode, setInviteCode] = useState('');
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [token, setToken] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = "https://mvp-backend-6r1j.onrender.com"; // ПРОВЕРЬ СВОЙ URL

  // Проверка существующей сессии
  useEffect(() => {
    const savedToken = localStorage.getItem('alpha_token');
    if (savedToken) {
      setToken(savedToken);
      setStep(3);
      fetchJobs(savedToken);
    }
  }, []);

  const handleCodeSubmit = () => {
    if (inviteCode.length > 3) setStep(2);
  };

  const handleAlphaLogin = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('invite_code', inviteCode);
    formData.append('name', profile.name);
    formData.append('email', profile.email);

    try {
      const res = await fetch(`${API_URL}/auth/alpha-login`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        localStorage.setItem('alpha_token', data.token);
        setStep(3);
        fetchJobs(data.token);
      } else {
        alert(data.detail || "Ошибка входа");
      }
    } catch (e) {
      alert("Сервер недоступен");
    }
    setLoading(false);
  };

  const fetchJobs = async (t) => {
    try {
      const res = await fetch(`${API_URL}/jobs?token=${t}`);
      const data = await res.json();
      if (Array.isArray(data)) setJobs(data);
    } catch (e) {}
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('token', token);

    try {
      const res = await fetch(`${API_URL}/jobs/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setFile(null);
        fetchJobs(token);
        alert("Книга загружена! Перевод начался.");
      }
    } catch (e) {
      alert("Ошибка загрузки");
    }
    setLoading(false);
  };

  const downloadJob = async (jobId) => {
    const res = await fetch(`${API_URL}/jobs/${jobId}/download?token=${token}`);
    const data = await res.json();
    if (data.url) window.location.href(data.url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 font-sans text-slate-900">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-semibold text-center mb-2">PDF Translator Alpha</h1>
        <p className="text-slate-500 text-center mb-8 text-sm">Перевод книг для личного использования (MVP)</p>

        {/* ШАГ 1: ВВОД КОДА */}
        {step === 1 && (
          <div className="space-y-4">
            <input 
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите инвайт-код"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
            <button 
              onClick={handleCodeSubmit}
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Продолжить
            </button>
          </div>
        )}

        {/* ШАГ 2: ПРОФИЛЬ */}
        {step === 2 && (
          <div className="space-y-4">
            <input 
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ваше имя"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <input 
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email (для связи)"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
            <button 
              onClick={handleAlphaLogin}
              disabled={loading}
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-400"
            >
              {loading ? "Вход..." : "Начать работу"}
            </button>
          </div>
        )}

        {/* ШАГ 3: ЗАГРУЗКА И СПИСОК */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
              <input 
                type="file" 
                accept=".pdf,.epub"
                onChange={(e) => setFile(e.target.files[0])}
                className="mb-4 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button 
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300"
              >
                {loading ? "Загрузка..." : "Загрузить для перевода"}
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-slate-700 border-b pb-2">Ваши переводы</h3>
              {jobs.length === 0 && <p className="text-slate-400 text-sm italic">Здесь пока ничего нет</p>}
              {jobs.map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="overflow-hidden mr-2">
                    <p className="text-sm font-medium truncate">{job.filename}</p>
                    <p className={`text-xs ${job.status === 'completed' ? 'text-green-600' : 'text-blue-500'}`}>
                      {job.status === 'completed' ? 'Готово' : 'В процессе...'}
                    </p>
                  </div>
                  {job.status === 'completed' && (
                    <button 
                      onClick={() => downloadJob(job.id)}
                      className="bg-white border border-slate-200 text-xs px-3 py-1 rounded shadow-sm hover:bg-slate-50"
                    >
                      Скачать
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="w-full text-xs text-slate-400 hover:text-slate-600"
            >
              Выйти (сбросить сессию)
            </button>
          </div>
        )}
      </div>
      <p className="mt-8 text-slate-400 text-xs">Alpha Version. For personal and academic use only.</p>
    </div>
  );
}
