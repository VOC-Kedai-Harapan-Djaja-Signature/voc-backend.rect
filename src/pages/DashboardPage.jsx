import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PROTOTIPE } from '../utils/config.js';
import {
  ROLE_LABEL,
  readStoredToken,
  storeToken,
  parseValidSession,
} from '../utils/session.js';
import { apiFetch, apiFetchOptional } from '../utils/api.js';
import {
  RIWAYAT_HARI,
  INTERVAL_KE_API,
  INTERVAL_DARI_API,
  MENU_UMUM,
  csvCell,
  todayISO,
  todayNoon,
  fromApi,
  suggestionFromApi,
  getFilteredReviews,
  getPreviousPeriodReviews,
  getReviewAverageRating,
} from '../utils/helpers.js';
import ToastContainer from '../components/ToastContainer.jsx';
import LoginScreen from '../components/dashboard/LoginScreen.jsx';
import Sidebar from '../components/dashboard/Sidebar.jsx';
import Header from '../components/dashboard/Header.jsx';
import TabSummaryAndSuggestions from '../components/dashboard/TabSummaryAndSuggestions.jsx';
import TabAnalyticsAndDemographics from '../components/dashboard/TabAnalyticsAndDemographics.jsx';
import TabReviewsAndSettings from '../components/dashboard/TabReviewsAndSettings.jsx';
import ManualReviewModal from '../components/dashboard/ManualReviewModal.jsx';
import PdfPreviewModal from '../components/dashboard/PdfPreviewModal.jsx';

const DEFAULT_FILTERS = { period: '1w', source: 'ALL', topic: 'ALL', menu: 'ALL' };

export default function DashboardPage() {
  const [toasts, setToasts] = useState([]);
  const [sessionState, setSessionState] = useState({
    isLoggedIn: false,
    token: null,
    name: '',
    role: '',
    exp: 0,
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarHidden, setDesktopSidebarHidden] = useState(false);
  const [activeTab, setActiveTab] = useState('tab1');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [suggestionInterval, setSuggestionInterval] = useState('Mingguan');
  const [threshold, setThreshold] = useState(5);
  const [reviews, setReviews] = useState([]);
  const [activeSuggestions, setActiveSuggestions] = useState([]);
  const [completedSuggestions, setCompletedSuggestions] = useState([]);
  const [latestReport, setLatestReport] = useState(null);

  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('ALL');
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [runningAiReport, setRunningAiReport] = useState(false);

  const loggedInRef = useRef(false);
  loggedInRef.current = sessionState.isLoggedIn;

  const showToast = useCallback((message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const endSession = useCallback(
    (message) => {
      storeToken(null);
      setSessionState({ isLoggedIn: false, token: null, name: '', role: '', exp: 0 });
      setMobileSidebarOpen(false);
      setReviews([]);
      setActiveSuggestions([]);
      setCompletedSuggestions([]);
      setLatestReport(null);
      setManualModalOpen(false);
      setPdfModalOpen(false);
      if (message) showToast(message);
    },
    [showToast]
  );

  useEffect(() => {
    document.title = 'Voice of Customer — Harapan Djaja Signature Gunung Anyar';
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = 'noindex, nofollow';
    return () => {
      if (robotsMeta && robotsMeta.parentNode) robotsMeta.parentNode.removeChild(robotsMeta);
    };
  }, []);

  useEffect(() => {
    if (!sessionState.isLoggedIn || !sessionState.exp) return;
    const msLeft = sessionState.exp - Date.now();
    if (msLeft <= 0) {
      endSession('Sesi login berakhir. Silakan masuk lagi.');
      return;
    }
    const timer = setTimeout(
      () => endSession('Sesi login berakhir. Silakan masuk lagi.'),
      Math.min(msLeft, 2147483647)
    );
    return () => clearTimeout(timer);
  }, [sessionState.isLoggedIn, sessionState.exp, endSession]);

  const applySettings = useCallback((settings) => {
    setThreshold(settings.suggestion_threshold);
    setSuggestionInterval(INTERVAL_DARI_API[settings.suggestion_interval] || 'Mingguan');
  }, []);

  const loadDashboardData = useCallback(
    async (tokenOverride = sessionState.token) => {
      setActiveSuggestions([]);
      setCompletedSuggestions([]);
      if (PROTOTIPE) {
        setReviews([]);
        return;
      }

      const ctx = { token: tokenOverride, onUnauthorized: endSession };
      const awal = todayNoon();
      awal.setDate(awal.getDate() - RIWAYAT_HARI);
      const from = awal.toISOString().slice(0, 10);

      const semua = [];
      let total = Infinity;
      while (semua.length < total) {
        const body = await apiFetch(`/reviews?from=${from}&limit=1000&offset=${semua.length}`, {}, ctx);
        if (!body || !Array.isArray(body.data)) throw Object.assign(new Error('format'), { status: -1 });
        if (body.data.length === 0) break;
        semua.push(...body.data);
        total = Number(body.total) || 0;
      }
      if (!loggedInRef.current) return;
      setReviews(semua.map(fromApi));

      const [pengaturan, aktif, selesai, laporan] = await Promise.all([
        apiFetch('/settings', {}, ctx),
        apiFetch('/suggestions?status=aktif', {}, ctx),
        apiFetch('/suggestions?status=selesai', {}, ctx),
        apiFetchOptional('/reports/weekly/latest', ctx),
      ]);
      if (!loggedInRef.current) return;
      applySettings(pengaturan);
      setActiveSuggestions(aktif.data.map(suggestionFromApi));
      setCompletedSuggestions(selesai.data.map(suggestionFromApi));
      setLatestReport(laporan);
    },
    [sessionState.token, endSession, applySettings]
  );

  const activateSessionAndLoad = useCallback(
    async (sess) => {
      loggedInRef.current = true;
      setSessionState({
        isLoggedIn: true,
        token: sess.token,
        name: sess.name,
        role: sess.role,
        exp: sess.exp,
      });
      setMobileSidebarOpen(false);
      try {
        await loadDashboardData(sess.token);
      } catch (err) {
        if (err.status !== 401) showToast('Data dashboard gagal dimuat. Coba muat ulang halaman.');
      }
    },
    [loadDashboardData, showToast]
  );

  // Pulihkan sesi dari sessionStorage sekali saja saat halaman dibuka.
  // Tanpa penjaga ini, efek ikut jalan lagi setiap token berubah sehingga data dimuat dua kali.
  const sesiDipulihkanRef = useRef(false);
  useEffect(() => {
    if (sesiDipulihkanRef.current) return;
    sesiDipulihkanRef.current = true;
    const savedToken = readStoredToken();
    if (!PROTOTIPE && savedToken) {
      const valid = parseValidSession(savedToken);
      if (valid) {
        storeToken(savedToken);
        activateSessionAndLoad(valid);
        return;
      }
    }
    storeToken(null);
  }, [activateSessionAndLoad]);

  const handleLoginSuccess = async (token) => {
    if (PROTOTIPE) {
      await activateSessionAndLoad({ token: null, name: 'Mode Prototipe', role: '', exp: 0 });
      showToast('Masuk mode prototipe: belum tersambung ke API, login tidak diperiksa.');
      return;
    }
    const valid = parseValidSession(token);
    if (!valid) throw Object.assign(new Error('token'), { status: -1 });
    storeToken(token);
    await activateSessionAndLoad(valid);
    showToast(`Berhasil masuk sebagai ${valid.name}.`);
  };

  const canEditSettings = PROTOTIPE || sessionState.role === 'kepala_cabang';

  const shownSuggestions = useMemo(
    () => activeSuggestions.filter((s) => s.kind === 'perbaikan' && s.complaintCount >= threshold),
    [activeSuggestions, threshold]
  );

  const filteredReviews = useMemo(() => getFilteredReviews(reviews, filters), [reviews, filters]);
  const prevPeriodReviews = useMemo(() => getPreviousPeriodReviews(reviews, filters), [reviews, filters]);

  const activeNonDefaultFilterCount = useMemo(() => {
    let count = 0;
    if (filters.period !== '1w') count++;
    if (filters.source !== 'ALL') count++;
    if (filters.topic !== 'ALL') count++;
    if (filters.menu !== 'ALL') count++;
    return count;
  }, [filters]);

  const handleIntervalChange = async (label) => {
    const prev = suggestionInterval;
    if (PROTOTIPE) {
      setSuggestionInterval(label);
    } else {
      try {
        const res = await apiFetch(
          '/settings',
          { method: 'PATCH', body: JSON.stringify({ suggestion_interval: INTERVAL_KE_API[label] }) },
          { token: sessionState.token, onUnauthorized: endSession }
        );
        applySettings(res);
      } catch (err) {
        setSuggestionInterval(prev);
        if (err.status === 0) showToast('Server tidak bisa dihubungi. Interval belum tersimpan.');
        else if (err.status !== 401) showToast((err.body && err.body.message) || 'Interval belum tersimpan. Coba lagi.');
        return;
      }
    }
    showToast(`Interval saran diubah ke: ${label}.`);
  };

  const handleSaveThreshold = async (newVal) => {
    const v = Math.min(25, Math.max(2, Number(newVal) || 5));
    if (PROTOTIPE) {
      setThreshold(v);
    } else {
      try {
        const res = await apiFetch(
          '/settings',
          { method: 'PATCH', body: JSON.stringify({ suggestion_threshold: v }) },
          { token: sessionState.token, onUnauthorized: endSession }
        );
        applySettings(res);
      } catch (err) {
        if (err.status === 0) showToast('Server tidak bisa dihubungi. Ambang belum tersimpan.');
        else if (err.status !== 401) showToast((err.body && err.body.message) || 'Ambang belum tersimpan. Coba lagi.');
        return;
      }
    }
    showToast(`Ambang munculnya saran disimpan: ${v} keluhan baru.`);
  };

  const handleConfirmSuggestionDone = async (sugId, rawNote) => {
    const saran = activeSuggestions.find((s) => s.id === sugId);
    if (!saran) return;
    const note = String(rawNote || '').trim().slice(0, 300);

    if (PROTOTIPE) {
      setActiveSuggestions((prev) => prev.filter((s) => s.id !== sugId));
      setCompletedSuggestions((prev) => [
        { ...saran, completedDate: todayISO(), note: note || 'Tanpa catatan.' },
        ...prev,
      ]);
    } else {
      try {
        const hasil = await apiFetch(
          `/suggestions/${encodeURIComponent(sugId)}/complete`,
          { method: 'PATCH', body: JSON.stringify({ note: note || null }) },
          { token: sessionState.token, onUnauthorized: endSession }
        );
        setActiveSuggestions((prev) => prev.filter((s) => s.id !== sugId));
        setCompletedSuggestions((prev) => [suggestionFromApi(hasil), ...prev]);
      } catch (err) {
        if (err.status === 409) {
          setActiveSuggestions((prev) => prev.filter((s) => s.id !== sugId));
          try {
            const selesai = await apiFetch('/suggestions?status=selesai', {}, { token: sessionState.token, onUnauthorized: endSession });
            setCompletedSuggestions(selesai.data.map(suggestionFromApi));
          } catch {}
          showToast('Saran ini sudah ditandai selesai sebelumnya.');
        } else if (err.status === 0) {
          showToast('Server tidak bisa dihubungi. Saran belum ditandai selesai.');
        } else if (err.status !== 401) {
          showToast((err.body && err.body.message) || 'Saran belum tersimpan. Coba lagi.');
        }
        return;
      }
    }
    showToast('Saran berhasil ditandai selesai dan masuk ke Riwayat Saran.');
  };

  const handleToggleReviewResponse = async (revId) => {
    const target = reviews.find((r) => r.id === revId);
    if (!target) return;
    const tandai = target.responseStatus === 'Belum Ditanggapi';

    if (!PROTOTIPE) {
      try {
        await apiFetch(
          `/reviews/${encodeURIComponent(revId)}/respond`,
          { method: 'PATCH', body: JSON.stringify({ responded: tandai }) },
          { token: sessionState.token, onUnauthorized: endSession }
        );
      } catch (err) {
        if (err.status === 0) showToast('Server tidak bisa dihubungi. Status belum tersimpan.');
        else if (err.status === 404) showToast('Ulasan tidak ditemukan. Muat ulang halaman.');
        else if (err.status !== 401) showToast((err.body && err.body.message) || 'Status belum tersimpan. Coba lagi.');
        return;
      }
    }

    const nextStatus = tandai ? 'Sudah Ditanggapi' : 'Belum Ditanggapi';
    setReviews((prev) =>
      prev.map((r) => (r.id === revId ? { ...r, responseStatus: nextStatus } : r))
    );
    showToast(`Status ulasan diperbarui menjadi "${nextStatus}".`);
  };

  const handleManualReviewSubmit = async ({ source, date, rating, topic, comment }) => {
    if (PROTOTIPE) {
      setReviews((prev) => [
        {
          id: `LOKAL-${Date.now()}`,
          date,
          source,
          satisfied: rating >= 4,
          topic,
          menu: MENU_UMUM,
          ratings: null,
          singleRating: rating,
          averageRating: rating,
          gender: 'Non-QR',
          ageGroup: 'Non-QR',
          comment,
          responseStatus: 'Belum Ditanggapi',
        },
        ...prev,
      ]);
      setManualModalOpen(false);
      showToast(`Ulasan ${source} ditambahkan (mode prototipe, hanya di browser ini).`);
      return;
    }

    const body = await apiFetch(
      '/reviews/manual',
      {
        method: 'POST',
        body: JSON.stringify({
          text: comment,
          source: source === 'Google Maps' ? 'google_maps' : 'social_media',
          review_date: date,
          rating,
          topic: topic.toLowerCase(),
        }),
      },
      { token: sessionState.token, onUnauthorized: endSession }
    );
    const savedId = body && body.id;
    setManualModalOpen(false);
    try {
      await loadDashboardData();
    } catch (err) {
      if (err.status !== 401) showToast('Ulasan tersimpan, tapi dashboard gagal dimuat ulang. Muat ulang halaman.');
      return;
    }
    showToast(`Ulasan ${source} tersimpan di database (id ${savedId}).`);
  };

  const handleRunAiReport = async () => {
    setMobileSidebarOpen(false);
    if (PROTOTIPE) {
      showToast('Mode prototipe: analisis AI butuh API.');
      return;
    }
    setRunningAiReport(true);
    try {
      const hasil = await apiFetch(
        '/reports/weekly',
        { method: 'POST', body: '{}', timeoutMs: 300000 },
        { token: sessionState.token, onUnauthorized: endSession }
      );
      await loadDashboardData();
      showToast(`Analisis selesai: ${hasil.analyzed_reviews} ulasan dinilai AI, ${hasil.suggestions_created} saran dibuat.`);
    } catch (err) {
      if (err.status === 0) showToast('Analisis gagal: server tidak bisa dihubungi atau terlalu lama.');
      else if (err.status !== 401) showToast((err.body && err.body.message) || 'Analisis AI gagal. Coba lagi.');
    } finally {
      setRunningAiReport(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Tanggal', 'Sumber', 'Sentimen', 'Topik', 'Menu', 'RataRataBintang', 'StatusTanggapan', 'Komentar'];
    const rows = filteredReviews.map((r) =>
      [
        r.id,
        r.date,
        r.source,
        r.satisfied === true ? 'Puas' : r.satisfied === false ? 'Tidak Puas' : 'Belum dinilai',
        r.topic,
        r.menu,
        getReviewAverageRating(r) ?? '',
        r.responseStatus,
        r.comment,
      ].map(csvCell)
    );

    const csvContent = '\uFEFF' + [headers.map(csvCell).join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VoC_HarapanDjaja_GunungAnyar_${filters.period}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMobileSidebarOpen(false);
    showToast(`Berhasil mengunduh CSV (${filteredReviews.length} ulasan terfilter).`);
  };

  const roleText = PROTOTIPE ? 'prototipe' : ROLE_LABEL[sessionState.role] || sessionState.role || 'Pengguna';

  return (
    <div className="dashboard-theme min-h-screen bg-[#FAF9F6] text-[#231712] selection:bg-[#231712] selection:text-[#FAF9F6]">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {!sessionState.isLoggedIn ? (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div id="dashboardApp" className="min-h-screen flex bg-[#FAF9F6] text-[#231712]">
          <Sidebar
            mobileOpen={mobileSidebarOpen}
            desktopHidden={desktopSidebarHidden}
            filters={filters}
            activeFilterCount={activeNonDefaultFilterCount}
            runningAiReport={runningAiReport}
            onCloseMobile={() => setMobileSidebarOpen(false)}
            onHideDesktop={() => setDesktopSidebarHidden(true)}
            onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
            onApplyFilters={() => {
              if (window.innerWidth < 1024) setMobileSidebarOpen(false);
              showToast('Filter data berhasil diterapkan.');
            }}
            onResetFilters={() => {
              setFilters(DEFAULT_FILTERS);
              showToast('Seluruh filter dikembalikan ke pengaturan default.');
            }}
            onOpenManualModal={() => {
              setMobileSidebarOpen(false);
              setManualModalOpen(true);
            }}
            onExportCsv={handleExportCsv}
            onOpenPdfModal={() => {
              setMobileSidebarOpen(false);
              setPdfModalOpen(true);
            }}
            onRunAiReport={handleRunAiReport}
            onLogout={() => endSession('Anda telah keluar dari dashboard.')}
          />

          <div className="flex-1 min-w-0 flex flex-col">
            <Header
              greetingText={`Halo, ${sessionState.name} (${roleText})`}
              totalDisplayed={filteredReviews.length}
              activeFilterCount={activeNonDefaultFilterCount}
              desktopSidebarHidden={desktopSidebarHidden}
              activeTab={activeTab}
              onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
              onToggleDesktopSidebar={() => setDesktopSidebarHidden((prev) => !prev)}
              onSelectTab={setActiveTab}
            />

            <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-6">
              {activeTab === 'tab1' && (
                <TabSummaryAndSuggestions
                  filtered={filteredReviews}
                  prevReviews={prevPeriodReviews}
                  filters={filters}
                  threshold={threshold}
                  suggestionInterval={suggestionInterval}
                  canEditSettings={canEditSettings}
                  activeSuggestions={activeSuggestions}
                  shownSuggestions={shownSuggestions}
                  completedSuggestions={completedSuggestions}
                  onIntervalChange={handleIntervalChange}
                  onConfirmSuggestionDone={handleConfirmSuggestionDone}
                  onToggleReviewResponse={handleToggleReviewResponse}
                  onSwitchTab={setActiveTab}
                  onNotify={showToast}
                />
              )}

              {activeTab === 'tab2' && (
                <TabAnalyticsAndDemographics
                  filtered={filteredReviews}
                  prevReviews={prevPeriodReviews}
                  allReviews={reviews}
                  filters={filters}
                  latestReport={latestReport}
                  completedSuggestions={completedSuggestions}
                />
              )}

              {activeTab === 'tab3' && (
                <TabReviewsAndSettings
                  filtered={filteredReviews}
                  threshold={threshold}
                  canEditSettings={canEditSettings}
                  completedSuggestions={completedSuggestions}
                  reviewSearch={reviewSearch}
                  reviewStatusFilter={reviewStatusFilter}
                  token={sessionState.token}
                  onUnauthorized={endSession}
                  onSaveThreshold={handleSaveThreshold}
                  onReviewSearchChange={setReviewSearch}
                  onReviewStatusFilterChange={setReviewStatusFilter}
                  onToggleReviewResponse={handleToggleReviewResponse}
                  onNotify={showToast}
                />
              )}
            </main>

            <footer className="border-t border-[#231712]/15 bg-[#FAF9F6] py-4 px-4 sm:px-6 text-xs text-[#231712]/70">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>Voice of Customer (VoC) — Kedai Harapan Djaja Signature, Cabang Gunung Anyar</span>
                <span>Standar Mutu ISO/IEC 25010 &amp; Privasi UU PDP No. 27/2022</span>
              </div>
            </footer>
          </div>

          <ManualReviewModal
            open={manualModalOpen}
            onClose={() => setManualModalOpen(false)}
            onSubmit={handleManualReviewSubmit}
            onNotify={showToast}
          />

          <PdfPreviewModal
            open={pdfModalOpen}
            filtered={filteredReviews}
            filters={filters}
            shownSuggestions={shownSuggestions}
            completedCount={completedSuggestions.length}
            printedBy={sessionState.name}
            onClose={() => setPdfModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
