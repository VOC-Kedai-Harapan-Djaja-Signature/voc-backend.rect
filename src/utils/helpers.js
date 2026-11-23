export const SOURCE_LABEL = { qr: 'QR', google_maps: 'Google Maps', social_media: 'Media Sosial' };
export const MENU_UMUM = 'Umum / Tidak Menyebut Menu';
export const RIWAYAT_HARI = 732;
export const DAY_MS = 1000 * 60 * 60 * 24;
export const EVALUASI_HARI = 14;
export const EVALUASI_MIN_HARI = 7;

export const INTERVAL_KE_API = {
  Mingguan: 'mingguan',
  '2 Mingguan': '2_mingguan',
  '3 Mingguan': '3_mingguan',
  Bulanan: 'bulanan',
};

export const INTERVAL_DARI_API = Object.fromEntries(
  Object.entries(INTERVAL_KE_API).map(([label, nilai]) => [nilai, label])
);

export const PRIORITAS_LABEL = { mendesak: 'Mendesak', sedang: 'Sedang', rendah: 'Rendah' };

export function csvCell(value) {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function todayNoon() {
  return new Date(`${todayISO()}T12:00:00`);
}

export function daysAgo(dateStr, today = todayNoon()) {
  return Math.round((today - new Date(`${dateStr}T12:00:00`)) / DAY_MS);
}

export function tanggalLokal(waktu) {
  const d = new Date(waktu);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function kapital(teks) {
  return teks ? teks.charAt(0).toUpperCase() + teks.slice(1) : '–';
}

export function kelompokUmur(age) {
  if (age < 20) return '< 20 thn';
  if (age <= 25) return '20–25 thn';
  if (age <= 35) return '26–35 thn';
  return '> 35 thn';
}

export function fromApi(item) {
  const isQr = item.source === 'qr';
  const kosong = isQr ? 'Tidak dijawab' : 'Non-QR';
  const topik = Array.isArray(item.topics) && item.topics.length > 0 ? String(item.topics[0]) : '';
  const menu = Array.isArray(item.menus) && item.menus.length > 0 ? String(item.menus[0]) : '';
  return {
    id: String(item.id),
    date: item.date,
    source: SOURCE_LABEL[item.source] || item.source,
    satisfied: typeof item.satisfied === 'boolean' ? item.satisfied : null,
    topic: topik ? topik.charAt(0).toUpperCase() + topik.slice(1) : '–',
    menu: menu || MENU_UMUM,
    ratings: isQr ? item.ratings : null,
    singleRating: item.rating,
    averageRating: typeof item.average_rating === 'number' ? item.average_rating : null,
    gender: item.gender === 'laki-laki' ? 'Laki-laki' : item.gender === 'perempuan' ? 'Perempuan' : kosong,
    ageGroup: Number.isInteger(item.age) ? kelompokUmur(item.age) : kosong,
    comment: item.text || '(tanpa komentar)',
    responseStatus: item.responded ? 'Sudah Ditanggapi' : 'Belum Ditanggapi',
  };
}

export function suggestionFromApi(s) {
  return {
    id: String(s.id),
    kind: s.kind,
    topic: kapital(s.topic),
    priority: PRIORITAS_LABEL[s.priority] || s.priority,
    complaintCount: s.complaint_count,
    text: s.text,
    reason: s.reason || '',
    completedDate: s.completed_at ? tanggalLokal(s.completed_at) : null,
    completedBy: s.completed_by || '',
    note: s.completion_note || 'Tanpa catatan.',
  };
}

export function getReviewAverageRating(rev) {
  return typeof rev.averageRating === 'number' ? rev.averageRating : null;
}

export function fmtRating(rev) {
  const avg = getReviewAverageRating(rev);
  return avg === null ? '–' : `${avg.toFixed(1)}★`;
}

export function fmtStars(value) {
  return typeof value === 'number' ? `${value}★` : '–';
}

export function getDaysCutoff(periodKey) {
  switch (periodKey) {
    case '1w': return 7;
    case '2w': return 14;
    case '3w': return 21;
    case '1m': return 31;
    case '1y': return 365;
    default: return 7;
  }
}

export function matchesNonPeriodFilters(r, filters) {
  if (filters.source !== 'ALL' && r.source !== filters.source) return false;
  if (filters.topic !== 'ALL' && r.topic !== filters.topic) return false;
  if (filters.menu !== 'ALL' && r.menu !== filters.menu) return false;
  return true;
}

export function getFilteredReviews(reviews, filters) {
  const maxDays = getDaysCutoff(filters.period);
  const today = todayNoon();
  return reviews.filter((r) => {
    const diffDays = daysAgo(r.date, today);
    if (diffDays > maxDays) return false;
    return matchesNonPeriodFilters(r, filters);
  });
}

export function getPreviousPeriodReviews(reviews, filters) {
  const span = getDaysCutoff(filters.period) + 1;
  const today = todayNoon();
  return reviews.filter((r) => {
    const diffDays = daysAgo(r.date, today);
    return diffDays >= span && diffDays < span * 2 && matchesNonPeriodFilters(r, filters);
  });
}

export function bucketReviewsByPeriod(reviews, period) {
  const maxDays = getDaysCutoff(period);
  const today = todayNoon();
  const fmtDay = (d) => `${d.getDate()}/${d.getMonth() + 1}`;

  let buckets;
  let indexOf;
  if (period === '1y') {
    const monthKey = (d) => d.getFullYear() * 12 + d.getMonth();
    const first = new Date(today.getTime() - maxDays * DAY_MS);
    const firstKey = monthKey(first);
    const count = monthKey(today) - firstKey + 1;
    buckets = Array.from({ length: count }, (_, i) => ({
      label: new Date(first.getFullYear(), first.getMonth() + i, 1).toLocaleDateString('id-ID', { month: 'short' }),
      puas: 0,
      neg: 0,
    }));
    indexOf = (r) => monthKey(new Date(`${r.date}T12:00:00`)) - firstKey;
  } else {
    const size = period === '1w' || period === '2w' ? 1 : 7;
    const count = Math.ceil((maxDays + 1) / size);
    buckets = Array.from({ length: count }, (_, i) => {
      const startAgo = (count - 1 - i) * size + size - 1;
      return { label: fmtDay(new Date(today.getTime() - Math.min(startAgo, maxDays) * DAY_MS)), puas: 0, neg: 0 };
    });
    indexOf = (r) => count - 1 - Math.floor(Math.max(0, daysAgo(r.date, today)) / size);
  }

  reviews.forEach((r) => {
    const idx = indexOf(r);
    if (idx < 0 || idx >= buckets.length) return;
    if (r.satisfied === true) buckets[idx].puas++;
    else if (r.satisfied === false) buckets[idx].neg++;
  });
  return buckets;
}
