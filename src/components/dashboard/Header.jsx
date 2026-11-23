import React from 'react';

const TABS = [
  { id: 'tab1', label: 'Ringkasan & Saran' },
  { id: 'tab2', label: 'Analisis Grafik & Demografi' },
  { id: 'tab3', label: 'Semua Ulasan & Pengaturan' },
];

export default function Header({
  greetingText,
  totalDisplayed,
  activeFilterCount,
  desktopSidebarHidden,
  activeTab,
  onOpenMobileSidebar,
  onToggleDesktopSidebar,
  onSelectTab,
}) {
  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur border-b border-[#231712]/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden px-3 py-2 rounded-xl bg-[#231712] text-[#FAF9F6] text-xs font-bold flex items-center gap-1.5 shrink-0 active:scale-[0.98] transition cursor-pointer"
          >
            <span>☰ Filter &amp; Menu</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#FAF9F6] text-[#231712] text-[10px] font-extrabold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            className="hidden lg:inline-flex px-3 py-2 rounded-xl border-[1.5px] border-[#231712] bg-[#FAF9F6] hover:bg-[#231712]/5 text-xs font-bold text-[#231712] items-center gap-1.5 shrink-0 transition cursor-pointer"
          >
            <span>{desktopSidebarHidden ? '☰ Tampilkan Sidebar' : '◧ Sembunyikan Sidebar'}</span>
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-[#231712] truncate">
              Harapan Djaja — Gunung Anyar
            </h1>
            <p className="text-[11px] sm:text-xs font-medium text-[#231712]/75 truncate">
              {greetingText}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-[#231712]/5 border border-[#231712]/20 text-xs font-bold text-[#231712]">
            {totalDisplayed} ulasan ditampilkan
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-2.5">
        <nav className="grid grid-cols-3 gap-1.5 sm:gap-2.5" aria-label="Navigasi Tab Dashboard">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={
                  isActive
                    ? 'py-2.5 px-2 sm:px-4 rounded-xl text-[11px] sm:text-xs md:text-sm font-bold text-center transition cursor-pointer bg-[#231712] text-[#FAF9F6]'
                    : 'py-2.5 px-2 sm:px-4 rounded-xl text-[11px] sm:text-xs md:text-sm font-bold text-center transition cursor-pointer bg-[#FAF9F6] text-[#231712] border-[1.5px] border-[#231712]/25 hover:border-[#231712]'
                }
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
