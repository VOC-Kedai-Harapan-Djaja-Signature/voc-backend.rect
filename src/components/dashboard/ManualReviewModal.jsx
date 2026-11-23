import React, { useEffect, useState } from 'react';
import { todayISO } from '../../utils/helpers.js';

export default function ManualReviewModal({ open, onClose, onSubmit, onNotify }) {
  const [source, setSource] = useState('Google Maps');
  const [date, setDate] = useState(todayISO());
  const [rating, setRating] = useState(5);
  const [topic, setTopic] = useState('Rasa');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && !date) setDate(todayISO());
  }, [open, date]);

  if (!open) return null;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const cleanComment = comment.trim();
    if (cleanComment.length < 3) {
      onNotify('Teks ulasan minimal 3 karakter.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        source,
        date: date || todayISO(),
        rating,
        topic,
        comment: cleanComment,
      });
      setComment('');
    } catch (err) {
      if (err.status === 0) onNotify('Server tidak bisa dihubungi. Ulasan belum tersimpan.');
      else if (err.status !== 401) onNotify((err.body && err.body.message) || 'Ulasan belum tersimpan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231712]/55 backdrop-blur-[1px]">
      <div className="bg-[#FAF9F6] border-2 border-[#231712] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#231712]/20">
          <div>
            <h3 className="text-base font-extrabold text-[#231712]">Input Ulasan Manual</h3>
            <p className="text-xs text-[#231712]/75">
              Tambahkan ulasan dari Google Maps atau Media Sosial untuk dianalisis AI
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg border border-[#231712]/30 text-xs font-bold text-[#231712] hover:bg-[#231712] hover:text-[#FAF9F6] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="manualSource" className="block text-xs font-bold text-[#231712] mb-1">
                Sumber Platform
              </label>
              <select
                id="manualSource"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9F6] border border-[#231712]/35 rounded-xl text-[#231712] focus:outline-none focus:border-[#231712]"
              >
                <option value="Google Maps">Google Maps</option>
                <option value="Media Sosial">Media Sosial</option>
              </select>
            </div>

            <div>
              <label htmlFor="manualDate" className="block text-xs font-bold text-[#231712] mb-1">
                Tanggal Ulasan
              </label>
              <input
                type="date"
                id="manualDate"
                max={todayISO()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9F6] border border-[#231712]/35 rounded-xl text-[#231712] focus:outline-none focus:border-[#231712]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#231712] mb-1">Bintang (1–5)</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`w-9 h-9 rounded-xl border-[1.5px] border-[#231712] text-xs font-bold transition cursor-pointer ${
                      star === rating
                        ? 'bg-[#231712] text-[#FAF9F6]'
                        : 'bg-[#FAF9F6] text-[#231712]'
                    }`}
                  >
                    {star}★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="manualTopic" className="block text-xs font-bold text-[#231712] mb-1">
                Topik Utama
              </label>
              <select
                id="manualTopic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9F6] border border-[#231712]/35 rounded-xl text-[#231712] focus:outline-none focus:border-[#231712]"
              >
                <option value="Rasa">Rasa</option>
                <option value="Harga">Harga</option>
                <option value="Pelayanan">Pelayanan</option>
                <option value="Tempat">Tempat</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="manualComment" className="block text-xs font-bold text-[#231712] mb-1">
              Teks Ulasan
            </label>
            <textarea
              id="manualComment"
              rows={3}
              minLength={3}
              maxLength={2000}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tulis isi ulasan pelanggan di sini..."
              className="w-full px-3.5 py-2.5 text-xs font-medium bg-[#FAF9F6] border border-[#231712]/35 rounded-xl text-[#231712] focus:outline-none focus:border-[#231712]"
            />
            <p className="mt-1 text-[11px] text-[#231712]/70">
              Simulasi AI otomatis menentukan sentimen (Puas ≥ 4★, Tidak Puas ≤ 3★) dan mendeteksi nama menu dari teks ulasan.
            </p>
          </div>

          <div className="pt-3 border-t border-[#231712]/15 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border-[1.5px] border-[#231712] bg-[#FAF9F6] text-xs font-bold text-[#231712] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[#231712] text-[#FAF9F6] text-xs font-bold hover:bg-[#231712]/90 cursor-pointer disabled:opacity-60"
            >
              Simpan &amp; Analisis AI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
