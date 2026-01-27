'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = "https://mvp-backend-6r1j.onrender.com";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const orderId = searchParams.get('order_id');
    const cryptoInvoice = searchParams.get('crypto_invoice');

    if (sessionId) {
      // Stripe payment
      fetchStripeSession(sessionId);
    } else if (orderId) {
      // Wallet Pay payment
      fetchWalletPayOrder(orderId);
    } else if (cryptoInvoice) {
      // CryptoBot payment
      fetchCryptoInvoice(cryptoInvoice);
    } else {
      setError('No payment information found');
      setLoading(false);
    }
  }, [searchParams]);

  const fetchStripeSession = async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/api/stripe/session/${sessionId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Failed to fetch payment status');
        setLoading(false);
        return;
      }

      if (data.status === 'pending') {
        // Payment still processing, poll again
        setTimeout(() => fetchStripeSession(sessionId), 2000);
        return;
      }

      setPaymentData(data);
      setLoading(false);
    } catch (e) {
      console.error('Error fetching session:', e);
      setError('Failed to fetch payment status');
      setLoading(false);
    }
  };

  const fetchWalletPayOrder = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/api/wallet-pay/order/${orderId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Failed to fetch payment status');
        setLoading(false);
        return;
      }

      if (data.status === 'pending') {
        // Payment still processing, poll again
        setTimeout(() => fetchWalletPayOrder(orderId), 2000);
        return;
      }

      setPaymentData(data);
      setLoading(false);
    } catch (e) {
      console.error('Error fetching order:', e);
      setError('Failed to fetch payment status');
      setLoading(false);
    }
  };

  const fetchCryptoInvoice = async (invoiceCode) => {
    try {
      const res = await fetch(`${API_URL}/api/cryptobot/invoice/${invoiceCode}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Failed to fetch payment status');
        setLoading(false);
        return;
      }

      if (data.status === 'pending') {
        // Payment still processing, poll again
        setTimeout(() => fetchCryptoInvoice(invoiceCode), 2000);
        return;
      }

      setPaymentData(data);
      setLoading(false);
    } catch (e) {
      console.error('Error fetching crypto invoice:', e);
      setError('Failed to fetch payment status');
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (paymentData?.invite_code) {
      navigator.clipboard.writeText(paymentData.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-slate-800">Обработка платежа...</h2>
          <p className="text-slate-500 text-sm mt-2">Пожалуйста, подождите, мы подтверждаем ваш платёж</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Что-то пошло не так</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <Link
            href="/pricing"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Попробовать снова
          </Link>
        </div>
      </div>
    );
  }

  if (paymentData?.status !== 'completed') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-yellow-600 text-2xl font-bold">...</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Платёж в обработке</h2>
          <p className="text-slate-500 text-sm mb-6">
            Ваш платёж обрабатывается. Пожалуйста, обновите страницу через пару минут.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-500 text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Оплата успешна!</h1>
          <p className="text-slate-500 mt-2">Спасибо за покупку</p>
        </div>

        {/* Code Display */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-500 mb-2">Ваш код активации:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-slate-200 rounded px-4 py-3 text-xl font-mono font-bold text-slate-800 text-center">
              {paymentData.invite_code}
            </code>
            <button
              onClick={copyCode}
              className="p-3 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex-shrink-0"
              title="Скопировать"
            >
              {copied ? (
                <span className="text-green-600 text-sm font-bold">✓</span>
              ) : (
                <span className="text-blue-600 text-sm">Копировать</span>
              )}
            </button>
          </div>
        </div>

        {/* Plan Details */}
        <div className="border-t border-slate-200 pt-4 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-500">Тариф:</span>
            <span className="font-medium text-slate-800">Тариф {paymentData.tier}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Слов:</span>
            <span className="font-medium text-slate-800">{paymentData.quota_words?.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href="/"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Начать перевод
        </Link>

        <p className="text-xs text-slate-400 text-center mt-4">
          Сохраните этот код! Он нужен для доступа к переводчику.
        </p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-slate-800">Loading...</h2>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
