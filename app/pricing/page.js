'use client';
import { useState } from 'react';
import Link from 'next/link';

const API_URL = "https://mvp-backend-6r1j.onrender.com";
const TELEGRAM_BOT = "PDFTranslatorBot"; // Change to your bot username

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

  const handleCryptoPayment = (tier) => {
    // Open Telegram bot with payment command
    window.open(`https://t.me/${TELEGRAM_BOT}?start=pay_${tier}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
            &larr; Back to Translator
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            One-time purchase. No subscription. Use your word quota whenever you need it.
          </p>
        </div>

        {/* Email input (optional) */}
        <div className="max-w-md mx-auto mb-8">
          <label className="block text-sm text-slate-600 mb-2">
            Email (optional, for receipt)
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
                  Most Popular
                </div>
              )}

              <h2 className="text-xl font-bold text-slate-800 mb-2">{tier.name}</h2>
              <p className="text-slate-500 text-sm mb-4">Tier {tier.id}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-800">{tier.priceEur}</span>
                <span className="text-slate-600 ml-1">EUR</span>
              </div>

              <div className="text-slate-600 mb-6">
                <span className="font-semibold text-slate-800">{tier.words}</span> words
              </div>

              {/* Stripe Button */}
              <button
                onClick={() => handleStripeCheckout(tier.id)}
                disabled={loading === tier.id}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg mb-3 disabled:bg-slate-400 transition-colors"
              >
                {loading === tier.id ? 'Processing...' : 'Pay with Card'}
              </button>

              {/* Crypto Button */}
              <button
                onClick={() => handleCryptoPayment(tier.id)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>Pay with Crypto</span>
                <span className="text-xs opacity-75">USDT/TON</span>
              </button>

              <p className="text-xs text-slate-400 mt-3 text-center">
                ${tier.priceUsd} USDT or {tier.priceTon} TON
              </p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl shadow p-6 max-w-2xl mx-auto">
          <h3 className="font-bold text-slate-800 mb-4">How it works</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600 text-sm">
            <li>Choose a plan and complete payment</li>
            <li>Receive your unique activation code</li>
            <li>Enter the code on the translator page</li>
            <li>Upload PDFs and get translations!</li>
          </ol>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Already have a code?{' '}
              <Link href="/" className="text-blue-600 hover:underline">
                Enter it here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
