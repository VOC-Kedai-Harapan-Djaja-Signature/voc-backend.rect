import React from 'react';

const PERIOD_LABELS = {
  '1w': '1 Minggu (Default)',
  '2w': '2 Minggu',
  '3w': '3 Minggu',
  '1m': 'Bulan',
  '1y': 'Tahun',
};

export default function PdfPreviewModal({
  open,
  filtered,
  filters,
  shownSuggestions,
  completedCount,
  printedBy,
  onClose,
}) {
  if (!open) return null;

  const total = filtered.length;
  const satCount = filtered.filter((r) => r.satisfied === true).length;
  const negList = filtered.filter((r) => r.satisfied === false);
  const satPct = satCount + negList.length > 0 ? Math.round((satCount / (satCount + negList.length)) * 100) : 0;
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#231712]/55 backdrop-blur-[1px]">
      <div className="bg-[#FAF9F6] border-2 border-[#231712] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="px-5 py-4 border-b border-[#231712]/20 flex items-center justify-between gap-2 no-print">
          <div>
            <h3 className="text-base font-extrabold text-[#231712]">Pratinjau Laporan Ringkasan (PDF)</h3>
            <p className="text-xs text-[#231712]/75">
              Siap dicetak atau disimpan ke PDF untuk evaluasi cabang &amp; manajemen pusat
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-[#231712] text-[#FAF9F6] text-xs font-bold hover:bg-[#231712]/90 cursor-pointer"
            >
              Cetak / Simpan PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border-[1.5px] border-[#231712] text-xs font-bold text-[#231712] cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

        <div id="pdfPrintArea" className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-[#FAF9F6] text-[#231712]">
          <div className="border-b-2 border-[#231712] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#231712]/70">
                Laporan Voice of Customer
              </p>
              <h2 className="text-xl font-extrabold text-[#231712]">
                Kedai Harapan Djaja Signature — Cabang Gunung Anyar
              </h2>
              <p className="text-xs text-[#231712]/75">Jl. Gunung Anyar, Surabaya</p>
            </div>
            <div className="text-xs sm:text-right">
              <p className="font-bold">Tanggal Cetak: {printDate}</p>
              <p className="text-[#231712]/75">
                Periode: {PERIOD_LABELS[filters.period] || filters.period} • Sumber: {filters.source}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 border-[1.5px] border-[#231712] rounded-xl">
              <span className="block text-[10px] font-bold uppercase text-[#231712]/70">Total Ulasan</span>
              <span className="text-lg font-extrabold">{total} Ulasan</span>
            </div>
            <div className="p-3 border-[1.5px] border-[#231712] rounded-xl">
              <span className="block text-[10px] font-bold uppercase text-[#231712]/70">Persentase Puas</span>
              <span className="text-lg font-extrabold">{satPct}% Puas</span>
            </div>
            <div className="p-3 border-[1.5px] border-[#231712] rounded-xl">
              <span className="block text-[10px] font-bold uppercase text-[#231712]/70">Ulasan Negatif</span>
              <span className="text-lg font-extrabold">{negList.length} Ulasan</span>
            </div>
            <div className="p-3 border-[1.5px] border-[#231712] rounded-xl">
              <span className="block text-[10px] font-bold uppercase text-[#231712]/70">Saran Terlaksana</span>
              <span className="text-lg font-extrabold">{completedCount} Tindakan</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider border-b border-[#231712]/30 pb-1.5 mb-3">
              Saran Tindakan Aktif Cabang
            </h4>
            <div className="space-y-2 text-xs">
              {shownSuggestions.map((s, i) => (
                <div key={s.id} className="p-2.5 border border-[#231712]/25 rounded-lg">
                  <strong>
                    {i + 1}. [{s.priority} • {s.topic}]
                  </strong>{' '}
                  {s.text}
                  <span className="block text-[11px] text-[#231712]/75 mt-0.5">{s.reason}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider border-b border-[#231712]/30 pb-1.5 mb-3">
              Sorotan Ulasan Negatif Terbaru
            </h4>
            <div className="space-y-2 text-xs">
              {negList.length === 0 ? (
                <p>Tidak ada ulasan negatif pada periode ini.</p>
              ) : (
                negList.slice(0, 5).map((r) => (
                  <div key={r.id} className="p-2.5 border border-[#231712]/25 rounded-lg">
                    <strong>
                      [{r.date} • {r.source} • {r.topic}]
                    </strong>{' '}
                    &ldquo;{r.comment}&rdquo;
                    <span className="block text-[11px] text-[#231712]/75 mt-0.5">
                      Status: {r.responseStatus}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-[#231712]/20 flex justify-between text-xs text-[#231712]/75">
            <span>Dicetak oleh: {printedBy || '-'}</span>
            <span>Sistem VoC — Harapan Djaja Signature</span>
          </div>
        </div>
      </div>
    </div>
  );
}
