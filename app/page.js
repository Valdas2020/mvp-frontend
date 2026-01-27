'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const [token, setToken] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [glossary, setGlossary] = useState('');
  const [jobs, setJobs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchUserInfo(savedToken);
      fetchJobs(savedToken);
    }
  }, []);

  // Polling for job updates
  useEffect(() => {
    if (!token) return;
    const hasPending = jobs.some(j => j.status === 'queued' || j.status === 'processing');
    if (!hasPending) return;

    const interval = setInterval(() => {
      fetchJobs(token);
    }, 5000);

    return () => clearInterval(interval);
  }, [token, jobs]);

  const fetchUserInfo = async (t) => {
    try {
      const res = await fetch(`${API_URL}/api/user/info?token=${t}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
    }
  };

  const fetchJobs = async (t) => {
    try {
      const res = await fetch(`${API_URL}/api/jobs?token=${t}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  const handleLogin = async () => {
    const deviceId = localStorage.getItem('device_id') || `device_${Date.now()}`;
    localStorage.setItem('device_id', deviceId);

    try {
      const res = await fetch(`${API_URL}/api/auth/invite-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: inviteCode, device_id: deviceId }),
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        fetchJobs(data.token);
      } else {
        const err = await res.json();
        alert(err.detail || 'Ошибка входа');
      }
    } catch (err) {
      alert('Ошибка сети');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Выберите файл');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/api/upload?token=${token}`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('Файл загружен! Перевод начался.');
        setFile(null);
        fetchJobs(token);
      } else {
        const err = await res.json();
        alert(err.detail || 'Ошибка загрузки');
      }
    } catch (err) {
      alert('Ошибка сети');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (jobId, filename) => {
    try {
      const res = await fetch(`${API_URL}/api/jobs/${jobId}/download?token=${token}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translated_${filename}.txt`;
        a.click();
      } else {
        alert('Ошибка скачивания');
      }
    } catch (err) {
      alert('Ошибка сети');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const tierConfig = {
    S: { words: 60000, label: 'Тариф S' },
    M: { words: 200000, label: 'Тариф M' },
    L: { words: 500000, label: 'Тариф L (скоро)' },
  };

  const statusLabels = {
    queued: 'В очереди',
    processing: 'Переводится...',
    completed: 'Готово',
    failed: 'Ошибка',
  };

  const currentTier = user?.tier ? tierConfig[user.tier] : null;
  const usedWords = jobs
    .filter((j) => j.status === 'completed')
    .reduce((sum, j) => sum + (j.word_count || 0), 0);
  const quotaPercent = currentTier ? Math.min((usedWords / currentTier.words) * 100, 100) : 0;

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="flex justify-center mb-6">
            <img src="/logo.svg" alt="Logo" width={120} height={120} />
          </div>
          <h1 className="text-3xl font-bold text-center mb-4 text-slate-800">
            PDF Переводчик с английского на русский
          </h1>
          <div className="text-xs text-slate-500 mb-6 text-left bg-slate-50 p-3 rounded-lg">
            <p className="mb-2">
              <strong>Дисклеймер:</strong> Мы не библиотека, мы не храним ваши файлы. Предоставленный pdf-файл уничтожается немедленно после перевода, txt-файл с переводом хранится 24 часа с момента окончания перевода.
            </p>
            <p>
              Ответственность за соблюдение авторских прав на предоставленные к переводу материалы целиком берет на себя пользователь. Загружая файл, пользователь подтверждает, что будет использовать перевод только лично, не для публикации.
            </p>
          </div>
          <input
            type="text"
            placeholder="Введите инвайт-код"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Войти
          </button>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500 mb-2">Нет кода?</p>
            <Link
              href="/pricing"
              className="text-blue-600 hover:underline font-medium"
            >
              Получить здесь →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.svg" alt="Logo" width={60} height={60} />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">PDF Переводчик с английского на русский</h1>
                <p className="text-slate-600">{user?.email || 'Пользователь'}</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                setToken('');
                setUser(null);
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition"
            >
              Выйти
            </button>
          </div>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Только для личного использования.</strong> 
          </p>
        </div>

        {currentTier && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-700 font-semibold">{currentTier.label}</span>
              <span className="text-slate-600 text-sm">
                {usedWords.toLocaleString()} / {currentTier.words.toLocaleString()} слов
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-500"
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Загрузить PDF</h2>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300'
            }`}
          >
            <input
              type="file"
              accept=".pdf,.epub"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-slate-600 mb-2">
                {file ? file.name : 'Перетащите файл или нажмите для выбора'}
              </p>
              <p className="text-sm text-slate-500">PDF (макс. 80МБ)</p>
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Глоссарий (опционально)
            </label>
            <textarea
              placeholder="термин1 = перевод1&#10;термин2 = перевод2"
              value={glossary}
              onChange={(e) => setGlossary(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {uploading ? 'Загрузка...' : 'Загрузить и перевести'}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Задания на перевод</h2>
          {jobs.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Пока нет заданий</p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{job.filename}</p>
                    <p className="text-sm text-slate-600">
                      Статус: <span className="font-medium">{statusLabels[job.status] || job.status}</span>
                      {job.word_count && ` • ${job.word_count.toLocaleString()} слов`}
                    </p>
                  </div>
                  {job.status === 'completed' && (
                    <button
                      onClick={() => handleDownload(job.id, job.filename)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Скачать
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
