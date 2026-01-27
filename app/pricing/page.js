'use client';
import { useState } from 'react';
import Link from 'next/link';

const API_URL = "https://mvp-backend-6r1j.onrender.com";

const TIERS = [
  {
    id: "S",
    name: "Starter",
    words: "200,000",
    priceEur: 3,
    priceUsd: 3,
    priceTon: 2,
    popular: false,
  },
  {
    id: "M",
    name: "Medium",
    words: "500,000",
    priceEur: 6,
    priceUsd: 6,
    priceTon: 4,
    popular: true,
  },
  {
    id: "L",
    name: "Large",
    words: "1,200,000",
    priceEur: 9,
    priceUsd: 9,
    priceTon: 6,
    popular: false,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(null);
  const [email, setEmail] = useState('');

  const handleStripeCheckout = async (tier) => {
    setLoading(tier);
    try {
      const res = await fetch(`${API_URL}/api/stripe/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, email: email || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || 'Failed to create checkout');
        setLoading(null);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;
    } catch (e) {
      console.error('Checkout error:', e);
      alert('Failed to create checkout session');
      setLoading(null);
    }
  };

  const handleCryptoPayment = async (tier, asset = "USDT") => {
    setLoading(`${tier}_crypto`);
    try {
      const res = await fetch(`${API_URL}/api/cryptobot/create-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, asset, email: email || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || 'Failed to create crypto invoice');
        setLoading(null);
        return;
      }

      // Redirect to CryptoBot payment page
      window.location.href = data.pay_url;
    } catch (e) {
      console.error('Crypto payment error:', e);
      alert('Failed to create crypto invoice');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
            &larr; Назад к переводчику
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mb-4">
            Выберите тариф
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            Разовая покупка. Без подписки. Используйте лимит слов когда вам удобно.
          </p>
        </div>

        {/* Email input for invite code delivery */}
        <div className="max-w-md mx-auto mb-8">
          <label className="block text-sm text-slate-600 mb-2">
            Email (код активации будет отправлен на указанный адрес)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`bg-white rounded-2xl shadow-lg p-6 relative ${
                tier.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
                  Популярный
                </div>
              )}

              <h2 className="text-xl font-bold text-slate-800 mb-2">{tier.name}</h2>
              <p className="text-slate-500 text-sm mb-4">Тариф {tier.id}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-800">{tier.priceEur}</span>
                <span className="text-slate-600 ml-1">EUR</span>
              </div>

              <div className="text-slate-600 mb-6">
                <span className="font-semibold text-slate-800">{tier.words}</span> слов
              </div>

              {/* Stripe Button */}
              <button
                onClick={() => handleStripeCheckout(tier.id)}
                disabled={loading === tier.id}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg mb-3 disabled:bg-slate-400 transition-colors"
              >
                {loading === tier.id ? 'Обработка...' : 'Оплатить картой'}
              </button>

              {/* Crypto Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCryptoPayment(tier.id, "USDT")}
                  disabled={loading === `${tier.id}_crypto`}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 px-3 rounded-lg transition-colors disabled:bg-slate-400"
                >
                  {loading === `${tier.id}_crypto` ? '...' : `$${tier.priceUsd} USDT`}
                </button>
                <button
                  onClick={() => handleCryptoPayment(tier.id, "TON")}
                  disabled={loading === `${tier.id}_crypto`}
                  className="flex-1 bg-blue-800 hover:bg-blue-900 text-white font-medium py-3 px-3 rounded-lg transition-colors disabled:bg-slate-400"
                >
                  {loading === `${tier.id}_crypto` ? '...' : `${tier.priceTon} TON`}
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-3 text-center">
                via @CryptoBot
              </p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl shadow p-6 max-w-2xl mx-auto">
          <h3 className="font-bold text-slate-800 mb-4">Как это работает</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600 text-sm">
            <li>Выберите тариф и произведите оплату</li>
            <li>Получите уникальный код активации на email</li>
            <li>Введите код на странице переводчика</li>
            <li>Загружайте PDF и получайте переводы!</li>
          </ol>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Уже есть код?{' '}
              <Link href="/" className="text-blue-600 hover:underline">
                Введите его здесь
              </Link>
            </p>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <img src="/logo.svg" alt="Logo" width={120} height={120} />
        </div>
      </div>
    </div>
  );
}
