import React from 'react';

export default function Sidebar({
  mobileOpen,
  desktopHidden,
  filters,
  activeFilterCount,
  runningAiReport,
  onCloseMobile,
  onHideDesktop,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  onOpenManualModal,
  onExportCsv,
  onOpenPdfModal,
  onRunAiReport,
  onLogout,
}) {
  const handleCloseBtn = () => {
    if (window.innerWidth < 1024) onCloseMobile();
    else onHideDesktop();
  };

  return (
    <>
      <div
        onClick={onCloseMobile}
        className={`fixed inset-0 z-40 bg-[#231712]/50 backdrop-blur-[1px] lg:hidden transition-opacity ${
          mobileOpen ? 'block' : 'hidden'
        }`}
        aria-hidden="true"
      />

      <aside
        aria-label="Sidebar Filter dan Menu"
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-[#FAF9F6] border-r border-[#231712]/20 flex flex-col transform transition-transform duration-200 ease-out lg:static lg:translate-x-0 lg:shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${desktopHidden ? 'lg:hidden' : 'lg:flex'}`}
      >
        <div className="p-4 border-b border-[#231712]/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#231712] text-[#FAF9F6] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm4-5v2m4-2v2m4-2v2" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-extrabold tracking-tight text-[#231712]">Filter &amp; Kontrol</p>
              <p className="text-[11px] text-[#231712]/70">Harapan Djaja Signature</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseBtn}
            className="px-2.5 py-1.5 rounded-xl border border-[#231712]/30 bg-[#FAF9F6] hover:bg-[#231712] hover:text-[#FAF9F6] text-xs font-bold text-[#231712] transition cursor-pointer"
            title="Sembunyikan Sidebar"
          >
            ✕ Tutup
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#231712]/70">
                Filter Data Ulasan
              </span>
              {activeFilterCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#231712] text-[#FAF9F6]">
                  {activeFilterCount} filter aktif
                </span>
              )}
            </div>

            <div>
              <label htmlFor="filterPeriod" className="block text-xs font-bold text-[#231712] mb-1">
                1. Periode
              </label>
              <select
                id="filterPeriod"
                value={filters.period}
                onChange={(e) => onFilterChange('period', e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-semibold bg-[#FAF9F6] border border-[#231712]/30 rounded-xl text-[#231712] focus:outline-none focus:border-[#231712]"
              >
                <option value="1w">1 Minggu (Default)</option>
                <option value="2w">2 Minggu</option>
                <option value="3w">3 Minggu</option>
                <option value="1m">Bulan</option>
                <option value="1y">Tahun</option>
              </select>
            </div>

            <div>
              <label htmlFor="filterSource" className="block text-xs font-bold text-[#231712] mb-1">
                2. Sumber Ulasan
              </label>
              <select
                id="filterSource"
                value={filters.source}
                onChange={(e) => onFilterChange('source', e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-semibold bg-[#FAF9F6] border border-[#231712]/30 rounded-xl text-[#231712] focus:outline-none focus:border-[#231712]"
              >
                <option value="ALL">Semua Sumber</option>
                <option value="QR">QR</option>
                <option value="Google Maps">Google Maps</option>
                <option value="Media Sosial">Media Sosial</option>
              </select>
            </div>

            <div>
              <label htmlFor="filterTopic" className="block text-xs font-bold text-[#231712] mb-1">
                3. Topik Keluhan / Pujian
              </label>
              <select
                id="filterTopic"
                value={filters.topic}
                onChange={(e) => onFilterChange('topic', e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-semibold bg-[#FAF9F6] border border-[#231712]/30 rounded-xl text-[#231712] focus:outline-none focus:border-[#231712]"
              >
                <option value="ALL">Semua Topik</option>
                <option value="Rasa">Rasa</option>
                <option value="Harga">Harga</option>
                <option value="Pelayanan">Pelayanan</option>
                <option value="Tempat">Tempat</option>
              </select>
            </div>

            <div>
              <label htmlFor="filterMenu" className="block text-xs font-bold text-[#231712] mb-1">
                4. Menu (Deteksi AI)
              </label>
              <select
                id="filterMenu"
                value={filters.menu}
                onChange={(e) => onFilterChange('menu', e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-semibold bg-[#FAF9F6] border border-[#231712]/30 rounded-xl text-[#231712] focus:outline-none focus:border-[#231712]"
              >
                <option value="ALL">Semua Menu</option>
                <option value="Kopi Susu Djaja">Kopi Susu Djaja</option>
                <option value="Es Kopi Aren">Es Kopi Aren</option>
                <option value="Matcha Latte">Matcha Latte</option>
                <option value="Croissant Butter">Croissant Butter</option>
                <option value="Nasi Goreng Signature">Nasi Goreng Signature</option>
                <option value="Umum / Tidak Menyebut Menu">Umum / Tidak Menyebut Menu</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onResetFilters}
                className="py-2.5 px-3 rounded-xl border-[1.5px] border-[#231712] bg-[#FAF9F6] hover:bg-[#231712]/5 text-xs font-bold text-[#231712] transition cursor-pointer"
              >
                Reset Filter
              </button>
              <button
                type="button"
                onClick={onApplyFilters}
                className="py-2.5 px-3 rounded-xl bg-[#231712] text-[#FAF9F6] hover:bg-[#231712]/90 text-xs font-bold transition cursor-pointer"
              >
                Terapkan Filter
              </button>
            </div>
          </div>

          <hr className="border-[#231712]/15" />

          <div className="space-y-2.5">
            <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#231712]/70">
              Menu Aksi &amp; Admin
            </span>

            <button
              type="button"
              onClick={onOpenManualModal}
              className="w-full py-2.5 px-3.5 rounded-xl bg-[#231712] text-[#FAF9F6] text-xs font-bold hover:bg-[#231712]/90 transition flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Input Ulasan Manual</span>
            </button>

            <button
              type="button"
              onClick={onExportCsv}
              className="w-full py-2.5 px-3.5 rounded-xl border-[1.5px] border-[#231712] bg-[#FAF9F6] hover:bg-[#231712]/5 text-xs font-bold text-[#231712] transition flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={onOpenPdfModal}
              className="w-full py-2.5 px-3.5 rounded-xl border-[1.5px] border-[#231712] bg-[#FAF9F6] hover:bg-[#231712]/5 text-xs font-bold text-[#231712] transition flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Ekspor PDF</span>
            </button>

            <button
              type="button"
              disabled={runningAiReport}
              onClick={onRunAiReport}
              className="w-full py-2.5 px-3.5 rounded-xl border-[1.5px] border-[#231712] bg-[#FAF9F6] hover:bg-[#231712]/5 text-xs font-bold text-[#231712] transition flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>
                {runningAiReport ? 'Menganalisis... (bisa 1–2 menit)' : 'Jalankan Analisis AI (7 hari)'}
              </span>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-[#231712]/20">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2.5 px-3.5 rounded-xl border border-[#231712]/35 bg-[#FAF9F6] hover:bg-[#231712] hover:text-[#FAF9F6] text-xs font-bold text-[#231712] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
