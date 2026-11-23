import React from 'react';
import {
  EVALUASI_HARI,
  EVALUASI_MIN_HARI,
  daysAgo,
  getReviewAverageRating,
  kapital,
  todayNoon,
} from '../../utils/helpers.js';

const MENUS = [
  'Kopi Susu Djaja',
  'Es Kopi Aren',
  'Matcha Latte',
  'Croissant Butter',
  'Nasi Goreng Signature',
  'Umum / Tidak Menyebut Menu',
];

export default function TabAnalyticsAndDemographics({
  filtered,
  prevReviews,
  allReviews,
  filters,
  latestReport,
  completedSuggestions,
}) {
  const total = filtered.length;

  // 1. Star distribution
  const starCounts = [0, 0, 0, 0, 0];
  filtered.forEach((r) => {
    const avg = getReviewAverageRating(r);
    if (avg === null) return;
    starCounts[Math.min(5, Math.max(1, Math.round(avg))) - 1]++;
  });
  const rated = starCounts.reduce((a, b) => a + b, 0);

  // 2. Review sources
  const sourceNames = ['QR', 'Google Maps', 'Media Sosial'];

  // 3. Topic trend
  const countNeg = (list, topic) => list.filter((r) => r.satisfied === false && r.topic === topic).length;

  // 4. Menu sentiment
  const maxMenuTotal = Math.max(...MENUS.map((m) => filtered.filter((r) => r.menu === m).length), 1);

  // 5. Recurring keywords
  const kataKunci = latestReport && Array.isArray(latestReport.keywords) ? latestReport.keywords : [];
  const maksKata = Math.max(...kataKunci.map((k) => k.jumlah), 1);

  // 6. Before vs After completed suggestion
  const perTopik = new Map();
  completedSuggestions.forEach((s) => {
    if (s.completedDate && !perTopik.has(s.topic)) perTopik.set(s.topic, s);
  });
  const today = todayNoon();
  const hitungKeluhan = (topic, dariHari, sampaiHari) =>
    allReviews.filter((r) => {
      const d = daysAgo(r.date, today);
      return r.satisfied === false && r.topic === topic && d >= dariHari && d <= sampaiHari;
    }).length;

  // 7 & 8. Demographics
  const isQrOnly = filters.source === 'QR';
  const genderItems = [
    { label: 'Laki-laki', count: filtered.filter((r) => r.gender === 'Laki-laki').length, style: 'bg-[#231712]' },
    { label: 'Perempuan', count: filtered.filter((r) => r.gender === 'Perempuan').length, style: 'bg-espresso-hatch border border-[#231712]' },
    { label: 'Tidak dijawab', count: filtered.filter((r) => r.gender === 'Tidak dijawab').length, style: 'bg-[#231712]/75' },
  ];
  if (!isQrOnly) {
    genderItems.push({
      label: 'Non-QR (Maps / Sosmed)',
      count: filtered.filter((r) => r.source !== 'QR').length,
      style: 'bg-[#FAF9F6] border-2 border-[#231712]',
    });
  }

  const ageGroups = [
    { label: '< 20 thn', count: filtered.filter((r) => r.ageGroup === '< 20 thn').length },
    { label: '20–25 thn', count: filtered.filter((r) => r.ageGroup === '20–25 thn').length },
    { label: '26–35 thn', count: filtered.filter((r) => r.ageGroup === '26–35 thn').length },
    { label: '> 35 thn', count: filtered.filter((r) => r.ageGroup === '> 35 thn').length },
    { label: 'Tidak dijawab', count: filtered.filter((r) => r.ageGroup === 'Tidak dijawab').length },
  ];
  if (!isQrOnly) {
    ageGroups.push({
      label: 'Non-QR (Maps / Sosmed)',
      count: filtered.filter((r) => r.source !== 'QR').length,
    });
  }

  return (
    <section className="space-y-6">
      <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold text-[#231712]">Analisis Grafik &amp; Demografi Pelanggan</h2>
          <p className="text-xs text-[#231712]/75">
            Pendalaman distribusi bintang, perbandingan menu, bukti evaluasi Minggu 11, serta profil Gender &amp; Umur dari Form QR (opsional).
          </p>
        </div>
        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#231712] text-[#FAF9F6] self-start sm:self-auto">
          8 Grafik Analitik
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Star Distribution */}
        <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-extrabold text-[#231712]">1. Distribusi Bintang 1 sampai 5</h3>
            <p className="text-xs text-[#231712]/75 mt-0.5">
              Sebaran skor dari 5★ hingga 1★ (gabungan rata-rata 4 aspek QR &amp; bintang manual)
            </p>
          </div>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const cnt = starCounts[star - 1];
              const pct = rated > 0 ? Math.round((cnt / rated) * 100) : 0;
              const fillClass = star >= 4 ? 'bg-[#231712]' : 'bg-espresso-hatch border border-[#231712]';
              return (
                <div key={star}>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>{star} ★ ({star >= 4 ? 'Puas' : 'Tidak Puas'})</span>
                    <span>{cnt} ulasan ({pct}%)</span>
                  </div>
                  <div className="w-full h-3.5 rounded-full bg-[#231712]/10 overflow-hidden p-0.5">
                    <div className={`h-full rounded-full ${fillClass} transition-all duration-300`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Review Source */}
        <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-extrabold text-[#231712]">2. Asal Ulasan</h3>
            <p className="text-xs text-[#231712]/75 mt-0.5">
              Perbandingan kanal QR Meja dengan ulasan publik Google Maps &amp; Media Sosial
            </p>
          </div>
          <div className="space-y-3.5">
            {sourceNames.map((src, idx) => {
              const cnt = filtered.filter((r) => r.source === src).length;
              const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
              const barStyle =
                idx === 0
                  ? 'bg-[#231712]'
                  : idx === 1
                    ? 'bg-espresso-hatch border border-[#231712]'
                    : 'bg-[#FAF9F6] border-2 border-[#231712]';
              return (
                <div key={src} className="p-3 rounded-xl border border-[#231712]/20 bg-[#FAF9F6]">
                  <div className="flex items-center justify-between text-xs font-extrabold mb-1.5">
                    <span>{src === 'QR' ? 'QR Meja (Langsung di Kedai)' : src}</span>
                    <span>{cnt} ulasan ({pct}%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#231712]/10 overflow-hidden">
                    <div className={`h-full rounded-full ${barStyle}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Topic Trend */}
        <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-extrabold text-[#231712]">3. Tren Keluhan per Topik</h3>
            <p className="text-xs text-[#231712]/75 mt-0.5">
              Perbandingan jumlah keluhan periode lalu vs periode ini (Membaik ▼ / Memburuk ▲)
            </p>
          </div>
          {total === 0 && prevReviews.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#231712]/5 border border-[#231712]/20 text-center">
              <p className="text-sm font-extrabold text-[#231712]">Belum ada data</p>
              <p className="text-xs text-[#231712]/75 mt-1">
                Perbandingan muncul setelah ada ulasan pada periode ini dan periode sebelumnya.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {['Rasa', 'Pelayanan', 'Tempat', 'Harga'].map((topic) => {
                const curr = countNeg(filtered, topic);
                const prev = prevReviews.length > 0 ? countNeg(prevReviews, topic) : null;
                const diff = prev !== null ? curr - prev : null;
                return (
                  <div key={topic} className="p-3 rounded-xl border border-[#231712]/20 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-[#231712]">Topik {topic}</span>
                      <p className="text-[11px] text-[#231712]/75 mt-0.5">
                        Periode lalu: <strong>{prev !== null ? `${prev} keluhan` : 'belum ada data'}</strong> → Sekarang:{' '}
                        <strong>{curr} keluhan</strong>
                      </p>
                    </div>
                    {diff === null ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#231712]/10 text-[#231712]">–</span>
                    ) : diff <= 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FAF9F6] border-[1.5px] border-[#231712] text-[#231712]">
                        Membaik ▼ ({diff})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#231712] text-[#FAF9F6]">
                        Memburuk ▲ (+{diff})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Menu Sentiment */}
        <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-6">
          <div className="mb-3">
            <h3 className="text-sm sm:text-base font-extrabold text-[#231712]">4. Menu Paling Sering Dipuji vs Dikeluhkan</h3>
            <p className="text-xs text-[#231712]/75 mt-0.5">
              Ekstraksi nama menu otomatis oleh AI dari kolom komentar bebas
            </p>
          </div>
          <div className="flex items-center gap-4 mb-3 text-xs font-bold text-[#231712]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#231712] inline-block" />
              Dipuji (Puas)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-espresso-hatch border border-[#231712] inline-block" />
              Dikeluhkan (Tidak Puas)
            </span>
          </div>
          <div className="space-y-3">
            {MENUS.map((m) => {
              const praised = filtered.filter((r) => r.menu === m && r.satisfied === true).length;
              const complained = filtered.filter((r) => r.menu === m && r.satisfied === false).length;
              return (
                <div key={m}>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="truncate pr-2">{m}</span>
                    <span className="shrink-0 text-[11px]">Dipuji: {praised} • Dikeluhkan: {complained}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-2.5 rounded-full bg-[#231712]/10 overflow-hidden">
                      <div className="h-full bg-[#231712] rounded-full" style={{ width: `${Math.round((praised / maxMenuTotal) * 100)}%` }} />
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#231712]/10 overflow-hidden">
                      <div className="h-full bg-espresso-hatch border border-[#231712] rounded-full" style={{ width: `${Math.round((complained / maxMenuTotal) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Recurring Keywords */}
        <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-extrabold text-[#231712]">5. Kata Kunci Keluhan Berulang</h3>
            <p className="text-xs text-[#231712]/75 mt-0.5">
              Kata atau frasa keluhan yang paling sering disebut pelanggan dalam ulasan
            </p>
          </div>
          {kataKunci.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#231712]/5 border border-[#231712]/20 text-center">
              <p className="text-sm font-extrabold text-[#231712]">Belum ada data</p>
              <p className="text-xs text-[#231712]/75 mt-1">
                {latestReport
                  ? 'Laporan AI terbaru belum menemukan kata keluhan yang berulang.'
                  : 'Klik "Jalankan Analisis AI" di sidebar untuk membuat laporan.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] text-[#231712]/70">
                Dari laporan AI {latestReport.period_start} s.d. {latestReport.period_end}
              </p>
              {kataKunci.map((k, idx) => (
                <div key={`${k.kata}-${idx}`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>
                      &ldquo;{k.kata}&rdquo;{' '}
                      <span className="font-semibold text-[#231712]/70">• {kapital(k.topik)}</span>
                    </span>
                    <span>{k.jumlah} ulasan</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#231712]/10 overflow-hidden">
                    <div className="h-full rounded-full bg-[#231712]" style={{ width: `${Math.round((k.jumlah / maksKata) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. Before vs After */}
        <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-6">
          <div className="mb-3">
            <h3 className="text-sm sm:text-base font-extrabold text-[#231712]">6. Sebelum vs Sesudah Saran Dilaksanakan</h3>
            <p className="text-xs text-[#231712]/75 mt-0.5">
              Bukti penurunan keluhan setelah tindakan perbaikan dijalankan kepala cabang
            </p>
          </div>
          {perTopik.size === 0 ? (
            <div className="p-6 rounded-xl bg-[#231712]/5 border border-[#231712]/20 text-center">
              <p className="text-sm font-extrabold text-[#231712]">Belum ada data</p>
              <p className="text-xs text-[#231712]/75 mt-1">
                Grafik terisi setelah Kepala Cabang menandai saran &ldquo;sudah dilaksanakan&rdquo;.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3.5">
                {[...perTopik.values()].map((s) => {
                  const k = daysAgo(s.completedDate, today);
                  const n = Math.min(EVALUASI_HARI, Math.max(0, k));
                  const sebelum = n > 0 ? hitungKeluhan(s.topic, k + 1, k + n) : 0;
                  const sesudah = n > 0 ? hitungKeluhan(s.topic, k - n, k - 1) : 0;
                  const maks = Math.max(sebelum, sesudah, 1);

                  return (
                    <div key={s.id} className="p-3 rounded-xl border border-[#231712]/20 bg-[#FAF9F6] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-[#231712]">Topik {s.topic}</span>
                        {n < EVALUASI_MIN_HARI ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#231712]/10 text-[#231712]">
                            Pantau (baru {n} hari)
                          </span>
                        ) : sesudah < sebelum ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FAF9F6] border-[1.5px] border-[#231712] text-[#231712]">
                            Turun {Math.round(((sebelum - sesudah) / sebelum) * 100)}% ▼
                          </span>
                        ) : sesudah > sebelum ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#231712] text-[#FAF9F6]">
                            Naik ▲ (+{sesudah - sebelum})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#231712]/10 text-[#231712]">
                            Tetap
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#231712]/75 truncate" title={s.text}>
                        Dilaksanakan {s.completedDate}: {s.text}
                      </p>
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span>Sebelum ({n} hari)</span>
                          <span>{sebelum} keluhan</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-[#231712]/10 overflow-hidden">
                          {sebelum > 0 && (
                            <div className="h-full rounded-full bg-espresso-hatch border border-[#231712]" style={{ width: `${Math.round((sebelum / maks) * 100)}%` }} />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span>Sesudah ({n} hari)</span>
                          <span>{sesudah} keluhan</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-[#231712]/10 overflow-hidden">
                          {sesudah > 0 && (
                            <div className="h-full rounded-full bg-[#231712]" style={{ width: `${Math.round((sesudah / maks) * 100)}%` }} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-[#231712]/75">
                Menghitung keluhan pada topik yang sama, maksimal {EVALUASI_HARI} hari sebelum vs sesudah tanggal pelaksanaan (tidak ikut filter sidebar). &ldquo;Pantau&rdquo; = belum {EVALUASI_MIN_HARI} hari, belum bisa disimpulkan.
              </p>
            </>
          )}
        </div>

        {/* 7. Gender Demographics */}
        <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-extrabold text-[#231712]">7. Demografi Gender (Form QR, opsional)</h3>
            <p className="text-xs text-[#231712]/75 mt-0.5">
              Proporsi responden Laki-laki &amp; Perempuan dari Form QR (Non-QR otomatis 0 saat filter QR aktif)
            </p>
          </div>
          <div className="space-y-3.5">
            {genderItems.map((g) => {
              const pct = total > 0 ? Math.round((g.count / total) * 100) : 0;
              return (
                <div key={g.label} className="p-3 rounded-xl border border-[#231712]/20 bg-[#FAF9F6]">
                  <div className="flex items-center justify-between text-xs font-extrabold mb-1.5">
                    <span>{g.label}</span>
                    <span>{g.count} responden ({pct}%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#231712]/10 overflow-hidden">
                    <div className={`h-full rounded-full ${g.style}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 8. Age Demographics */}
        <div className="bg-[#FAF9F6] border border-[#231712]/25 rounded-2xl p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-extrabold text-[#231712]">8. Demografi Kelompok Umur (Form QR, opsional)</h3>
            <p className="text-xs text-[#231712]/75 mt-0.5">
              Sebaran usia pengunjung cabang Gunung Anyar yang mengisi Form QR di meja
            </p>
          </div>
          <div className="space-y-3">
            {ageGroups.map((ag, idx) => {
              const pct = total > 0 ? Math.round((ag.count / total) * 100) : 0;
              const barFill = ag.label.startsWith('Non-QR')
                ? 'bg-espresso-hatch border border-[#231712]'
                : idx === 1
                  ? 'bg-[#231712]'
                  : 'bg-[#231712]/75';
              return (
                <div key={ag.label}>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>{ag.label}</span>
                    <span>{ag.count} orang ({pct}%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#231712]/10 overflow-hidden">
                    <div className={`h-full rounded-full ${barFill}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
