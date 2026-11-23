import React, { useEffect, useState } from 'react';
import { PROTOTIPE } from '../../utils/config.js';
import { apiFetch } from '../../utils/api.js';
import { fmtRating, fmtStars } from '../../utils/helpers.js';

export default function TabReviewsAndSettings({
  filtered,
  threshold,
  canEditSettings,
  completedSuggestions,
  reviewSearch,
  reviewStatusFilter,
  token,
  onUnauthorized,
  onSaveThreshold,
  onReviewSearchChange,
  onReviewStatusFilterChange,
  onToggleReviewResponse,
  onNotify,
}) {
  const [draftThreshold, setDraftThreshold] = useState(threshold);
  const [savingThreshold, setSavingThreshold] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    setDraftThreshold(threshold);
  }, [threshold]);

  // Kotak angka menyimpan ketikan apa adanya (supaya bisa mengetik 12, 15, dst.);
  // slider dan tombol simpan memakai nilai yang sudah dibatasi 2-25.
  const clampThreshold = (raw) => {
    const v = parseInt(raw, 10);
    return Math.min(25, Math.max(2, isNaN(v) ? 5 : v));
  };

  const handleThresholdInputChange = (raw) => {
    setDraftThreshold(String(raw).replace(/\D/g, '').slice(0, 2));
  };

  const handleSaveThresholdClick = async () => {
    const v = clampThreshold(draftThreshold);
    setDraftThreshold(v);
    setSavingThreshold(true);
    try {
      await onSaveThreshold(v);
    } finally {
      setSavingThreshold(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    let pesan = '';
    if (!currentPassword || !newPassword || !confirmPassword) {
      pesan = 'Isi password lama, password baru, dan ulangi password baru.';
    } else if (newPassword.length < 8) {
      pesan = 'Password baru minimal 8 karakter.';
    } else if (new TextEncoder().encode(newPassword).length > 72) {
      pesan = 'Password baru terlalu panjang (maksimal 72 karakter).';
    } else if (newPassword !== confirmPassword) {
      pesan = 'Ulangi password baru belum sama.';
    } else if (newPassword === currentPassword) {
      pesan = 'Password baru harus berbeda dari password lama.';
    } else if (PROTOTIPE) {
      pesan = 'Mode prototipe: password tidak bisa diganti.';
    }

    if (pesan) {
      onNotify(pesan);
      return;
    }

    setChangingPassword(true);
    try {
      await apiFetch(
        '/me/password',
        {
          method: 'PATCH',
          body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        },
        { token, onUnauthorized }
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onNotify('Password berhasil diganti. Pakai password baru saat login berikutnya.');
    } catch (err) {
      if (err.status === 0) onNotify('Server tidak bisa dihubungi. Password belum diganti.');
      else if (err.status !== 401) onNotify((err.body && err.body.message) || 'Password belum diganti. Coba lagi.');
    } finally {
      setChangingPassword(false);
    }
  };

  const query = reviewSearch.toLowerCase().trim();
  const searchedReviews = filtered
    .filter((r) => {
      if (reviewStatusFilter !== 'ALL' && r.responseStatus !== reviewStatusFilter) return false;
      if (query) {
        const hay = `${r.comment} ${r.menu} ${r.topic} ${r.source} ${r.gender} ${r.ageGroup}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const disabledHint = canEditSettings ? '' : 'Hanya Kepala Cabang yang dapat mengubah pengaturan ini.';

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Threshold Settings */}
        <div className="lg:col-span-5 bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#231712]/15">
              <h2 className="text-base font-extrabold text-[#231712]">Pengaturan Ambang Munculnya Saran</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#231712] text-[#FAF9F6]">Admin</span>
            </div>
            <p className="text-xs text-[#231712]/75 mt-3 leading-relaxed">
              Atur jumlah minimal keluhan baru pada topik yang sama agar sistem memunculkan kembali saran tindakan untuk Kepala Cabang.
            </p>

            <div className="mt-4 p-4 rounded-xl bg-[#231712]/5 border border-[#231712]/20 space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="thresholdSlider" className="text-xs font-bold text-[#231712]">
                  Batas Keluhan Baru:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    id="thresholdNumberInput"
                    min={2}
                    max={25}
                    value={draftThreshold}
                    disabled={!canEditSettings}
                    title={disabledHint}
                    onChange={(e) => handleThresholdInputChange(e.target.value)}
                    className="w-16 px-2 py-1 text-center text-sm font-extrabold bg-[#FAF9F6] border-[1.5px] border-[#231712] rounded-lg text-[#231712] disabled:opacity-60"
                  />
                  <span className="text-xs font-semibold text-[#231712]/75">keluhan</span>
                </div>
              </div>

              <input
                type="range"
                id="thresholdSlider"
                min={2}
                max={25}
                value={clampThreshold(draftThreshold)}
                disabled={!canEditSettings}
                title={disabledHint}
                onChange={(e) => setDraftThreshold(String(e.target.value))}
                className="w-full disabled:opacity-60"
              />

              <div className="flex justify-between text-[10px] font-semibold text-[#231712]/65">
                <span>2 (Sangat Sensitif)</span>
                <span>5 (Default)</span>
                <span>25 (Volume Tinggi)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#231712]/15 flex items-center justify-between gap-3">
            <span className="text-xs text-[#231712]/75">
              Ambang aktif: <strong className="text-[#231712]">{threshold} keluhan baru</strong>
            </span>
            <button
              type="button"
              disabled={!canEditSettings || savingThreshold}
              title={disabledHint}
              onClick={handleSaveThresholdClick}
              className="px-4 py-2 rounded-xl bg-[#231712] text-[#FAF9F6] text-xs font-bold hover:bg-[#231712]/90 transition cursor-pointer disabled:opacity-60"
            >
              Simpan Ambang
            </button>
          </div>
        </div>

        {/* Completed Suggestions History */}
        <div className="lg:col-span-7 bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#231712]/15">
            <div>
              <h2 className="text-base font-extrabold text-[#231712]">Riwayat Saran yang Sudah Dilaksanakan</h2>
              <p className="text-xs text-[#231712]/75 mt-0.5">
                Rekam jejak keputusan perbaikan cabang beserta catatan tindakan nyata
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold border-[1.5px] border-[#231712] text-[#231712]">
              {completedSuggestions.length} selesai
            </span>
          </div>

          <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
            {completedSuggestions.length === 0 ? (
              <p className="text-xs text-[#231712]/70 py-4 text-center">Belum ada saran yang ditandai selesai.</p>
            ) : (
              completedSuggestions.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#231712]/25">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FAF9F6] border-[1.5px] border-[#231712] text-[#231712]">
                        ✓ Sudah Dilaksanakan
                      </span>
                      <span className="text-[11px] font-bold text-[#231712]">Topik: {item.topic}</span>
                    </div>
                    <span className="text-[11px] text-[#231712]/70">
                      Selesai: {item.completedDate}
                      {item.completedBy ? ` • ${item.completedBy}` : ''}
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-[#231712]">{item.text}</p>
                  <p className="mt-1.5 text-[11px] text-[#231712]/85 bg-[#231712]/5 px-2.5 py-1.5 rounded-lg border border-[#231712]/15">
                    <strong>Catatan Kepala Cabang:</strong> {item.note}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-6">
        <div className="pb-3 border-b border-[#231712]/15">
          <h2 className="text-base font-extrabold text-[#231712]">Ganti Password</h2>
          <p className="text-xs text-[#231712]/75 mt-0.5">
            Untuk akun yang sedang masuk. Password baru minimal 8 karakter.
          </p>
        </div>
        <form onSubmit={handleChangePasswordSubmit} className="mt-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="currentPassword" className="block text-xs font-bold text-[#231712] mb-1">
                Password lama
              </label>
              <input
                type="password"
                id="currentPassword"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9F6] border border-[#231712]/35 rounded-xl text-[#231712] focus:outline-none focus:border-[#231712]"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-xs font-bold text-[#231712] mb-1">
                Password baru
              </label>
              <input
                type="password"
                id="newPassword"
                autoComplete="new-password"
                maxLength={72}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9F6] border border-[#231712]/35 rounded-xl text-[#231712] focus:outline-none focus:border-[#231712]"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#231712] mb-1">
                Ulangi password baru
              </label>
              <input
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                maxLength={72}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-[#FAF9F6] border border-[#231712]/35 rounded-xl text-[#231712] focus:outline-none focus:border-[#231712]"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="px-4 py-2 rounded-xl bg-[#231712] text-[#FAF9F6] text-xs font-bold hover:bg-[#231712]/90 transition cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              Simpan Password
            </button>
          </div>
        </form>
      </div>

      {/* All Reviews */}
      <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-[#231712]/15">
          <div>
            <h2 className="text-base font-extrabold text-[#231712]">Daftar Semua Ulasan</h2>
            <p className="text-xs text-[#231712]/75 mt-0.5">
              Menampilkan rincian 4 bintang aspek + demografi untuk sumber QR, serta bintang umum untuk sumber Manual
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={reviewSearch}
                onChange={(e) => onReviewSearchChange(e.target.value)}
                placeholder="Cari teks komentar, menu, topik..."
                className="w-full pl-9 pr-3.5 py-2 text-xs font-medium bg-[#FAF9F6] border border-[#231712]/35 rounded-xl text-[#231712] focus:outline-none focus:border-[#231712]"
              />
              <svg className="w-4 h-4 text-[#231712]/55 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
            </div>

            <select
              value={reviewStatusFilter}
              onChange={(e) => onReviewStatusFilterChange(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-[#FAF9F6] border border-[#231712]/35 rounded-xl text-[#231712] focus:outline-none focus:border-[#231712]"
            >
              <option value="ALL">Status: Semua</option>
              <option value="Belum Ditanggapi">Belum Ditanggapi</option>
              <option value="Sudah Ditanggapi">Sudah Ditanggapi</option>
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {searchedReviews.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#231712]/5 border border-[#231712]/20 text-center">
              <p className="text-sm font-extrabold text-[#231712]">Tidak ada ulasan yang cocok dengan pencarian Anda</p>
              <p className="text-xs text-[#231712]/75 mt-1">Coba ubah kata kunci pencarian atau reset filter di sidebar.</p>
            </div>
          ) : (
            searchedReviews.map((rev) => {
              const isUnresponded = rev.responseStatus === 'Belum Ditanggapi';
              return (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl bg-[#FAF9F6] border border-[#231712]/25 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {rev.satisfied === true ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FAF9F6] border-[1.5px] border-[#231712] text-[#231712]">
                          Puas
                        </span>
                      ) : rev.satisfied === false ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#231712] text-[#FAF9F6]">
                          Tidak Puas
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#231712]/10 text-[#231712]">
                          Belum dinilai
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded text-[11px] font-extrabold border border-[#231712]/35 text-[#231712]">
                        {rev.source}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#231712]/10 text-[#231712]">
                        Topik: {rev.topic}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold border border-[#231712]/20 text-[#231712]/85">
                        Menu: {rev.menu}
                      </span>
                      <span className="text-[11px] text-[#231712]/65">
                        {rev.date} • Rata-rata {fmtRating(rev)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-medium text-[#231712] leading-relaxed">
                      &ldquo;{rev.comment}&rdquo;
                    </p>

                    {rev.source === 'QR' && rev.ratings ? (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#231712]/85 pt-1">
                        <span className="px-2 py-0.5 rounded bg-[#231712]/5 font-semibold">
                          Rasa: <strong>{fmtStars(rev.ratings.rasa)}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#231712]/5 font-semibold">
                          Harga: <strong>{fmtStars(rev.ratings.harga)}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#231712]/5 font-semibold">
                          Pelayanan: <strong>{fmtStars(rev.ratings.pelayanan)}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#231712]/5 font-semibold">
                          Tempat: <strong>{fmtStars(rev.ratings.tempat)}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded border border-[#231712]/25 font-bold">
                          {rev.gender} • {rev.ageGroup}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#231712]/80 pt-1">
                        <span className="px-2 py-0.5 rounded bg-[#231712]/5 font-bold">
                          Bintang Umum: {rev.singleRating}★
                        </span>
                        <span>• Sumber Publik ({rev.source})</span>
                      </div>
                    )}
                  </div>

                  <div className="flex sm:items-center justify-between lg:flex-col lg:items-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#231712]/15">
                    <span className="text-[11px] font-extrabold text-[#231712]">{rev.responseStatus}</span>
                    <button
                      type="button"
                      onClick={() => onToggleReviewResponse(rev.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isUnresponded
                          ? 'bg-[#231712] text-[#FAF9F6] hover:bg-[#231712]/90'
                          : 'bg-[#FAF9F6] border-[1.5px] border-[#231712] text-[#231712] hover:bg-[#231712]/5'
                      }`}
                    >
                      {isUnresponded ? 'Tandai Sudah Ditanggapi' : 'Sudah Ditanggapi ✓'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
