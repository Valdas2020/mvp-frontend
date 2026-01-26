'use client';
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {/* Cancel Icon */}
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Cancelled</h1>
        <p className="text-slate-500 mb-6">
          Your payment was not completed. No charges were made.
        </p>

        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Try Again
          </Link>

          <Link
            href="/"
            className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          Having trouble? Contact support for help.
        </p>
      </div>
    </div>
  );
}
