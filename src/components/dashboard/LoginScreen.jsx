import React, { useState } from 'react';
import { PROTOTIPE } from '../../utils/config.js';
import { apiFetch } from '../../utils/api.js';

function loginErrorMessage(err) {
  if (err.status === 0) return 'Server tidak bisa dihubungi. Pastikan API menyala dan alamatnya benar di config.js.';
  if (err.status === 401) return 'Email atau password salah.';
  if (err.status === 429) return 'Terlalu banyak percobaan login. Coba lagi 15 menit lagi.';
  if (err.status === 422) return (err.body && err.body.message) || 'Email dan password wajib diisi.';
  if (err.status === -1) return 'Jawaban server tidak dikenali.';
  return 'Login gagal. Coba lagi beberapa saat lagi.';
}

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Harap isi email dan password terlebih dahulu.');
      return;
    }
    setError('');

    if (PROTOTIPE) {
      setPassword('');
      await onLoginSuccess(null);
      return;
    }

    setSubmitting(true);
    try {
      const body = await apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      if (!body || typeof body.token !== 'string') {
        throw Object.assign(new Error('token'), { status: -1 });
      }
      setPassword('');
      await onLoginSuccess(body.token);
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#FAF9F6]">
      <div className="w-full max-w-md bg-[#FAF9F6] border-2 border-[#231712] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3.5 pb-5 border-b border-[#231712]/20">
          <div className="w-12 h-12 rounded-xl bg-[#231712] text-[#FAF9F6] flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm4-5v2m4-2v2m4-2v2" />
            </svg>
          </div>
          <div>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#231712] text-[#FAF9F6] mb-1">
              Akses Terbatas
            </span>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-[#231712] leading-snug">
              Kedai Harapan Djaja Signature
            </h1>
            <p className="text-xs font-semibold text-[#231712]/75">Cabang Gunung Anyar, Surabaya</p>
          </div>
        </div>

        <div className="mt-4 p-3.5 rounded-xl bg-[#231712]/5 border border-[#231712]/20 text-xs leading-relaxed text-[#231712]/85">
          <p className="font-bold text-[#231712]">Gerbang Masuk Kepala Cabang</p>
        </div>

        {PROTOTIPE && (
          <div className="mt-4 p-3 rounded-xl border-[1.5px] border-dashed border-[#231712] text-xs text-[#231712]">
            <strong>Mode prototipe:</strong> belum tersambung ke API. Login tidak diperiksa dan dashboard kosong.
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-[#231712] text-[#FAF9F6] text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
          <div>
            <label htmlFor="loginEmail" className="block text-xs font-bold text-[#231712] mb-1.5">
              Email
            </label>
            <input
              type="email"
              id="loginEmail"
              autoComplete="username"
              inputMode="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#231712]/35 rounded-xl text-[#231712] focus:outline-none focus:border-[#231712] transition"
              placeholder="nama@contoh.id"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="loginPassword" className="block text-xs font-bold text-[#231712]">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-[11px] font-semibold underline text-[#231712]/75 hover:text-[#231712] cursor-pointer"
              >
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="loginPassword"
              autoComplete="current-password"
              maxLength={200}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#231712]/35 rounded-xl text-[#231712] focus:outline-none focus:border-[#231712] transition"
              placeholder="Masukkan password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-[#231712] text-[#FAF9F6] text-sm font-bold hover:bg-[#231712]/90 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            <span>{submitting ? 'Memeriksa...' : 'Masuk ke Dashboard'}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#231712]/15 flex items-center justify-between text-[11px] text-[#231712]/65">
          <span>Sistem VoC</span>
          <span>Akses khusus staf cabang</span>
        </div>
      </div>
    </section>
  );
}
