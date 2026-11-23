import React, { useState } from 'react';
import {
  bucketReviewsByPeriod,
  fmtRating,
  getReviewAverageRating,
} from '../../utils/helpers.js';

const NEUTRAL_BADGE = 'px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#231712]/10 text-[#231712]';
const FILLED_BADGE = 'px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#231712] text-[#FAF9F6]';
const OUTLINE_BADGE = 'px-2 py-0.5 rounded-full text-[11px] font-extrabold border-[1.5px] border-[#231712] text-[#231712]';

function arrow(diff) {
  return diff > 0 ? '▲ +' : diff < 0 ? '▼ ' : '= ';
}

export default function TabSummaryAndSuggestions({
  filtered,
  prevReviews,
  filters,
  threshold,
  suggestionInterval,
  canEditSettings,
  activeSuggestions,
  shownSuggestions,
  completedSuggestions,
  onIntervalChange,
  onConfirmSuggestionDone,
  onToggleReviewResponse,
  onSwitchTab,
  onNotify,
}) {
  const [openCompleteId, setOpenCompleteId] = useState(null);
  const [noteInputs, setNoteInputs] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  // KPI calculations
  const total = filtered.length;
  const satisfiedCount = filtered.filter((r) => r.satisfied === true).length;
  const negReviews = filtered.filter((r) => r.satisfied === false);
  const assessed = satisfiedCount + negReviews.length;
  const satisfiedPct = assessed > 0 ? Math.round((satisfiedCount / assessed) * 100) : null;
  const unrespondedNeg = negReviews.filter((r) => r.responseStatus === 'Belum Ditanggapi').length;

  const aspek = { Rasa: [0, 0], Harga: [0, 0], Pelayanan: [0, 0], Tempat: [0, 0] };
  const tambah = (nama, nilai) => {
    if (typeof nilai !== 'number') return;
    aspek[nama][0] += nilai;
    aspek[nama][1] += 1;
  };
  filtered.forEach((r) => {
    if (r.source === 'QR' && r.ratings) {
      tambah('Rasa', r.ratings.rasa);
      tambah('Harga', r.ratings.harga);
      tambah('Pelayanan', r.ratings.pelayanan);
      tambah('Tempat', r.ratings.tempat);
    } else if (aspek[r.topic]) {
      tambah(r.topic, getReviewAverageRating(r));
    }
  });
  const fmtAvg = ([sum, cnt]) => (cnt > 0 ? `${(sum / cnt).toFixed(1)}★` : '–');

  const prevTotal = prevReviews.length;
  const prevNeg = prevReviews.filter((r) => r.satisfied === false).length;
  const prevPuas = prevReviews.filter((r) => r.satisfied === true).length;
  const prevSatisfiedPct = prevPuas + prevNeg > 0 ? Math.round((prevPuas / (prevPuas + prevNeg)) * 100) : null;

  const totalTrendPct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;
  const negDiff = prevTotal > 0 ? negReviews.length - prevNeg : null;
  const diffPoints = satisfiedPct !== null && prevSatisfiedPct !== null ? satisfiedPct - prevSatisfiedPct : null;

  // Filtered suggestions
  const topicFilteredSuggestions = shownSuggestions.filter(
    (s) => filters.topic === 'ALL' || s.topic === filters.topic
  );
  const diBawahAmbang =
    activeSuggestions.filter((s) => s.kind === 'perbaikan').length - shownSuggestions.length;

  const recentNegative = [...negReviews]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const handleToggleComplete = (id) => {
    if (!canEditSettings) {
      onNotify('Hanya Kepala Cabang yang dapat menandai saran selesai.');
      return;
    }
    setOpenCompleteId((prev) => (prev === id ? null : id));
  };

  const handleConfirmDone = async (id) => {
    setSubmittingId(id);
    try {
      await onConfirmSuggestionDone(id, noteInputs[id] || '');
      setOpenCompleteId(null);
      setNoteInputs((prev) => ({ ...prev, [id]: '' }));
    } finally {
      setSubmittingId(null);
    }
  };

  // SVG 1: Sentiment Trend
  const buckets = bucketReviewsByPeriod(filtered, filters.period);
  const labelEvery = Math.ceil(buckets.length / 8);
  const labels = buckets.map((b, i) => ((buckets.length - 1 - i) % labelEvery === 0 ? b.label : ''));
  const puasPoints = buckets.map((b) => b.puas);
  const negPoints = buckets.map((b) => b.neg);
  const maxVal = Math.max(...puasPoints, ...negPoints, 4);
  const W = 440, H = 220, padL = 32, padR = 20, padT = 24, padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const getX = (idx) => padL + (labels.length === 1 ? plotW / 2 : (idx / (labels.length - 1)) * plotW);
  const getY = (val) => padT + plotH - (val / maxVal) * plotH;
  const puasPath = puasPoints.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`).join(' ');
  const negPath = negPoints.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`).join(' ');

  // SVG 2: Complaints by Topic
  const topics = ['Rasa', 'Harga', 'Pelayanan', 'Tempat'];
  const topicCounts = topics.map((t) => filtered.filter((r) => r.satisfied === false && r.topic === t).length);
  const totalNegTopic = topicCounts.reduce((a, b) => a + b, 0);
  const maxTopicCount = Math.max(...topicCounts, 1);
  const bW = 440, bH = 220, bPadL = 28, bPadR = 16, bPadT = 26, bPadB = 34;
  const bPlotW = bW - bPadL - bPadR;
  const bPlotH = bH - bPadT - bPadB;
  const slotW = bPlotW / topics.length;
  const barW = Math.min(48, slotW * 0.56);
  const topIdx = topicCounts.indexOf(Math.max(...topicCounts));
  const topVal = topicCounts[topIdx];

  return (
    <section className="space-y-6">
      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#231712]/75">Total Ulasan &amp; Puas</span>
            <span className={totalTrendPct !== null ? FILLED_BADGE : NEUTRAL_BADGE}>
              {totalTrendPct !== null ? `${arrow(totalTrendPct)}${totalTrendPct}%` : '–'}
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#231712]">{total}</span>
              <span className="text-xs font-semibold text-[#231712]/70">ulasan</span>
            </div>
            <p className="mt-1 text-xs font-bold text-[#231712]">
              <span>{satisfiedPct !== null ? `${satisfiedPct}%` : '–'}</span> Pelanggan Puas
            </p>
          </div>
        </div>

        <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#231712]/75">Negatif Belum Ditanggapi</span>
            <span className={negDiff === null ? NEUTRAL_BADGE : negDiff > 0 ? FILLED_BADGE : OUTLINE_BADGE}>
              {negDiff !== null ? `${arrow(negDiff)}${negDiff}` : '–'}
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#231712]">{unrespondedNeg}</span>
              <span className="text-xs font-semibold text-[#231712]/70">perlu respons</span>
            </div>
            <p className="mt-1 text-xs text-[#231712]/75">
              Dari <strong>{negReviews.length}</strong> ulasan tidak puas
            </p>
          </div>
        </div>

        <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#231712]/75">Saran Tindakan</span>
            <span className={NEUTRAL_BADGE}>Aksi Cabang</span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#231712]">{shownSuggestions.length}</span>
              <span className="text-xs font-bold text-[#231712]">Aktif</span>
              <span className="text-[#231712]/35">|</span>
              <span className="text-xl font-extrabold text-[#231712]/80">{completedSuggestions.length}</span>
              <span className="text-xs font-semibold text-[#231712]/75">Selesai</span>
            </div>
            <p className="mt-1 text-xs text-[#231712]/75">Rekomendasi berbasis keluhan</p>
          </div>
        </div>

        <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-[#231712]/75">Rata-rata Bintang Aspek</span>
            <span className="text-[10px] font-bold text-[#231712]/65">1.0–5.0</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div className="px-2 py-1 rounded-lg bg-[#231712]/5 flex items-center justify-between">
              <span className="text-[#231712]/75">Rasa</span>
              <strong className="text-[#231712]">{fmtAvg(aspek.Rasa)}</strong>
            </div>
            <div className="px-2 py-1 rounded-lg bg-[#231712]/5 flex items-center justify-between">
              <span className="text-[#231712]/75">Harga</span>
              <strong className="text-[#231712]">{fmtAvg(aspek.Harga)}</strong>
            </div>
            <div className="px-2 py-1 rounded-lg bg-[#231712]/5 flex items-center justify-between">
              <span className="text-[#231712]/75">Layanan</span>
              <strong className="text-[#231712]">{fmtAvg(aspek.Pelayanan)}</strong>
            </div>
            <div className="px-2 py-1 rounded-lg bg-[#231712]/5 flex items-center justify-between">
              <span className="text-[#231712]/75">Tempat</span>
              <strong className="text-[#231712]">{fmtAvg(aspek.Tempat)}</strong>
            </div>
          </div>
        </div>

        <div className="sm:col-span-2 xl:col-span-1 bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#231712]/75">Kepuasan vs Lalu</span>
            <span className={diffPoints === null ? NEUTRAL_BADGE : diffPoints >= 0 ? FILLED_BADGE : OUTLINE_BADGE}>
              {diffPoints !== null ? `${arrow(diffPoints)}${diffPoints}% poin` : '–'}
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#231712]">
                {satisfiedPct !== null ? `${satisfiedPct}%` : '–'}
              </span>
              <span className="text-xs text-[#231712]/70">
                vs <strong>{prevSatisfiedPct !== null ? `${prevSatisfiedPct}%` : '–'}</strong>
              </span>
            </div>
            <p className="mt-1 text-xs text-[#231712]/75">Perbandingan periode sebelumnya</p>
          </div>
        </div>
      </div>

      {/* Main 2-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Active Suggestions */}
          <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#231712]/15">
              <div>
                <h2 className="text-base font-extrabold text-[#231712]">Saran Tindakan Aktif</h2>
                <p className="text-xs text-[#231712]/75 mt-0.5">
                  Rekomendasi langkah perbaikan sederhana berdasarkan keluhan pelanggan
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label htmlFor="suggestionInterval" className="text-xs font-bold text-[#231712]/75">
                  Interval Saran:
                </label>
                <select
                  id="suggestionInterval"
                  value={suggestionInterval}
                  disabled={!canEditSettings}
                  title={canEditSettings ? '' : 'Hanya Kepala Cabang yang dapat mengubah pengaturan ini.'}
                  onChange={(e) => onIntervalChange(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold bg-[#FAF9F6] border-[1.5px] border-[#231712] rounded-xl text-[#231712] focus:outline-none disabled:opacity-60"
                >
                  <option value="Mingguan">Mingguan</option>
                  <option value="2 Mingguan">2 Mingguan</option>
                  <option value="3 Mingguan">3 Mingguan</option>
                  <option value="Bulanan">Bulanan</option>
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-3.5">
              {topicFilteredSuggestions.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#231712]/5 border border-[#231712]/20 text-center">
                  <p className="text-sm font-extrabold text-[#231712]">Tidak ada saran aktif untuk topik ini</p>
                  <p className="text-xs text-[#231712]/75 mt-1">
                    Saran baru akan muncul otomatis apabila tercatat {threshold} keluhan baru pada topik yang sama.
                  </p>
                  {diBawahAmbang > 0 && (
                    <p className="text-xs text-[#231712]/75 mt-1">
                      {diBawahAmbang} saran dari laporan AI terbaru belum ditampilkan karena jumlah keluhannya di bawah ambang.
                    </p>
                  )}
                </div>
              ) : (
                topicFilteredSuggestions.map((sug) => {
                  let badgeStyle = 'border border-[#231712]/40 bg-[#FAF9F6] text-[#231712]';
                  if (sug.priority === 'Mendesak') {
                    badgeStyle = 'bg-[#231712] text-[#FAF9F6] border border-[#231712]';
                  } else if (sug.priority === 'Sedang') {
                    badgeStyle = 'bg-espresso-hatch border-2 border-[#231712] text-[#231712]';
                  }

                  return (
                    <div
                      key={sug.id}
                      className="p-4 rounded-xl bg-[#FAF9F6] border-[1.5px] border-[#231712]/25 hover:border-[#231712] transition"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${badgeStyle}`}>
                            Prioritas: {sug.priority}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#231712]/5 border border-[#231712]/20 text-[#231712]">
                            Topik: {sug.topic}
                          </span>
                          <span className="text-[11px] font-semibold text-[#231712]/70">
                            • {suggestionInterval}
                          </span>
                        </div>
                        <span className="text-[11px] font-extrabold text-[#231712]">
                          {sug.complaintCount} keluhan
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-extrabold text-[#231712] leading-snug">
                        {sug.text}
                      </p>
                      <p className="text-xs text-[#231712]/75 mt-1">{sug.reason}</p>

                      <div className="mt-3 pt-3 border-t border-[#231712]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <span className="text-[11px] text-[#231712]/75">
                          Saran akan muncul lagi bila ada <strong className="text-[#231712]">{threshold} keluhan baru</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(sug.id)}
                          className="px-3.5 py-2 rounded-xl bg-[#231712] text-[#FAF9F6] text-xs font-bold hover:bg-[#231712]/90 transition shrink-0 self-start sm:self-auto cursor-pointer"
                        >
                          Tandai sudah dilaksanakan
                        </button>
                      </div>

                      {openCompleteId === sug.id && (
                        <div className="mt-3 pt-3 border-t border-[#231712]/25 bg-[#231712]/5 p-3 rounded-xl">
                          <label htmlFor={`note-input-${sug.id}`} className="block text-xs font-extrabold text-[#231712] mb-1">
                            Catatan Singkat Pelaksanaan:
                          </label>
                          <input
                            type="text"
                            id={`note-input-${sug.id}`}
                            autoFocus
                            value={noteInputs[sug.id] || ''}
                            onChange={(e) => setNoteInputs((prev) => ({ ...prev, [sug.id]: e.target.value }))}
                            placeholder="Sudah ganti takaran sirup & briefing barista"
                            className="w-full px-3 py-2 text-xs font-medium bg-[#FAF9F6] border border-[#231712]/40 rounded-xl text-[#231712] focus:outline-none focus:border-[#231712]"
                          />
                          <div className="mt-2.5 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setOpenCompleteId(null)}
                              className="px-3 py-1.5 rounded-xl border border-[#231712]/35 bg-[#FAF9F6] text-xs font-bold text-[#231712] cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              disabled={submittingId === sug.id}
                              onClick={() => handleConfirmDone(sug.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#231712] text-[#FAF9F6] text-xs font-bold hover:bg-[#231712]/90 cursor-pointer disabled:opacity-60"
                            >
                              Simpan &amp; Selesaikan
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Negative Reviews */}
          <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-[#231712]/15">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-[#231712]">Ulasan Negatif Terbaru</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#231712] text-[#FAF9F6]">
                    {negReviews.length} ulasan
                  </span>
                </div>
                <p className="text-xs text-[#231712]/75 mt-0.5">
                  Ulasan tidak puas ditandai otomatis agar segera ditanggapi Kepala Cabang
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSwitchTab('tab3')}
                className="text-xs font-bold underline text-[#231712] hover:opacity-75 self-start sm:self-auto cursor-pointer"
              >
                Lihat semua ulasan →
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {recentNegative.length === 0 ? (
                <div className="p-5 rounded-xl bg-[#231712]/5 border border-[#231712]/20 text-center text-xs font-semibold text-[#231712]/75">
                  Tidak ada ulasan negatif pada filter yang dipilih.
                </div>
              ) : (
                recentNegative.map((rev) => {
                  const isUnresponded = rev.responseStatus === 'Belum Ditanggapi';
                  return (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl bg-[#FAF9F6] border border-[#231712]/25 border-l-4 border-l-[#231712]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#231712] text-[#FAF9F6]">
                            NEGATIF
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold border border-[#231712]/30 text-[#231712]">
                            {rev.source}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#231712]/10 text-[#231712]">
                            Topik: {rev.topic}
                          </span>
                          <span className="text-[11px] font-extrabold text-[#231712]">{fmtRating(rev)}</span>
                          <span className="text-[11px] text-[#231712]/65">• {rev.date}</span>
                        </div>

                        {isUnresponded ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#231712] text-[#FAF9F6]">
                            Belum Ditanggapi
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF9F6] border-[1.5px] border-[#231712] text-[#231712]">
                            Sudah Ditanggapi
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm font-medium text-[#231712] leading-relaxed">
                        &ldquo;{rev.comment}&rdquo;
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-[#231712]/15 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-[#231712]/75">
                          Menu: <strong className="text-[#231712]">{rev.menu}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => onToggleReviewResponse(rev.id)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
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
        </div>

        {/* Right Column: 2 Core SVG Charts */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-6">
            <div className="mb-3">
              <h2 className="text-base font-extrabold text-[#231712]">Tren Puas vs Tidak Puas</h2>
              <p className="text-xs text-[#231712]/75 mt-0.5">
                Perbandingan jumlah ulasan puas dan tidak puas dari waktu ke waktu
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 mb-3 text-xs font-bold text-[#231712]">
              <span className="inline-flex items-center gap-2">
                <span className="w-6 h-0.5 bg-[#231712] inline-block" />
                Puas (Garis Penuh)
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-6 border-t-2 border-dashed border-[#231712] inline-block" />
                Tidak Puas (Putus-putus)
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#231712]/5 border border-[#231712]/20 text-center">
                <p className="text-sm font-extrabold text-[#231712]">Belum ada data</p>
                <p className="text-xs text-[#231712]/75 mt-1">
                  Grafik tren akan muncul setelah ada ulasan pada periode dan filter yang dipilih.
                </p>
              </div>
            ) : (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible" role="img" aria-label="Grafik Garis Tren Puas vs Tidak Puas">
                {[0, 0.5, 1].map((ratio) => {
                  const y = padT + plotH - ratio * plotH;
                  return (
                    <g key={ratio}>
                      <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#231712" strokeOpacity="0.12" strokeWidth="1" />
                      <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fontWeight="600" fill="#231712" fillOpacity="0.7">
                        {Math.round(ratio * maxVal)}
                      </text>
                    </g>
                  );
                })}
                <path d={puasPath} fill="none" stroke="#231712" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d={negPath} fill="none" stroke="#231712" strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" />
                {puasPoints.map((v, i) => {
                  const cx = getX(i);
                  const cy = getY(v);
                  return (
                    <g key={`p-${i}`}>
                      <circle cx={cx} cy={cy} r="4.5" fill="#231712" />
                      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="10" fontWeight="800" fill="#231712">{v}</text>
                    </g>
                  );
                })}
                {negPoints.map((v, i) => {
                  const cx = getX(i);
                  const cy = getY(v);
                  return (
                    <g key={`n-${i}`}>
                      <circle cx={cx} cy={cy} r="4.5" fill="#FAF9F6" stroke="#231712" strokeWidth="2.2" />
                      <text x={cx} y={cy + 15} textAnchor="middle" fontSize="10" fontWeight="700" fill="#231712">{v}</text>
                    </g>
                  );
                })}
                {labels.map((lbl, i) => (
                  <text key={`x-${i}`} x={getX(i)} y={H - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill="#231712">
                    {lbl}
                  </text>
                ))}
              </svg>
            )}
          </div>

          <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-6">
            <div className="mb-3">
              <h2 className="text-base font-extrabold text-[#231712]">Keluhan per Topik</h2>
              <p className="text-xs text-[#231712]/75 mt-0.5">
                Distribusi keluhan pada aspek Rasa, Harga, Pelayanan, dan Tempat
              </p>
            </div>

            <svg viewBox={`0 0 ${bW} ${bH}`} className="w-full h-auto overflow-visible" role="img" aria-label="Grafik Batang Keluhan per Topik">
              <defs>
                <pattern id="espressoDiagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <rect width="8" height="8" fill="#FAF9F6" />
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#231712" strokeWidth="2" strokeOpacity="0.45" />
                </pattern>
              </defs>
              <line x1={bPadL} y1={bPadT + bPlotH} x2={bW - bPadR} y2={bPadT + bPlotH} stroke="#231712" strokeOpacity="0.25" strokeWidth="1.5" />
              {topics.map((topic, i) => {
                const val = topicCounts[i];
                const pct = totalNegTopic > 0 ? Math.round((val / totalNegTopic) * 100) : 0;
                const barH = (val / maxTopicCount) * bPlotH;
                const x = bPadL + i * slotW + (slotW - barW) / 2;
                const y = bPadT + bPlotH - barH;
                const isHighest = val === maxTopicCount && val > 0;
                return (
                  <g key={topic}>
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={Math.max(2, barH)}
                      rx="6"
                      fill={isHighest ? '#231712' : 'url(#espressoDiagonalHatch)'}
                      stroke="#231712"
                      strokeWidth="1.8"
                    />
                    <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#231712">
                      {val} ({pct}%)
                    </text>
                    <text x={x + barW / 2} y={bH - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="#231712">
                      {topic}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="mt-3 p-3 rounded-xl bg-[#231712]/5 border border-[#231712]/20 text-xs text-[#231712]">
              {topVal > 0 ? (
                <>
                  Topik dengan keluhan terbanyak:{' '}
                  <strong>
                    {topics[topIdx]} ({topVal} keluhan / {Math.round((topVal / totalNegTopic) * 100)}%)
                  </strong>
                  .
                </>
              ) : (
                'Belum ada keluhan pada kombinasi filter yang dipilih.'
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
