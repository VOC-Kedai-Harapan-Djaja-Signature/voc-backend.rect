import React, { useEffect, useState } from 'react';
import { VOC_API, PROTOTIPE } from '../utils/config.js';
import '../styles/qr-form.css';

const BATAS_WAKTU_MS = 15000;
const ASPEK = [
  ['rasa', 'Rasa'],
  ['harga', 'Harga'],
  ['pelayanan', 'Pelayanan'],
  ['tempat', 'Tempat'],
];
const LABEL = ['', 'Buruk', 'Kurang', 'Cukup', 'Baik', 'Sangat baik'];
const INITIAL_RATES = { rasa: null, harga: null, pelayanan: null, tempat: null };

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.1 6.3 20.3l1.2-6.4L2.8 9.5l6.4-.8z" />
    </svg>
  );
}

function pesanGagal(status, body) {
  if (status === 0) return 'Ulasan belum terkirim. Periksa sinyal, lalu coba lagi.';
  if (status === 429) return 'Terlalu banyak kiriman dari jaringan ini. Coba lagi beberapa menit lagi.';
  if (status >= 500) return 'Server sedang bermasalah. Coba lagi beberapa saat lagi.';
  if (body && typeof body.message === 'string') return body.message;
  return 'Ulasan belum bisa dikirim. Periksa isian, lalu coba lagi.';
}

export default function QrFormPage() {
  const [gender, setGender] = useState('tidak_dijawab');
  const [age, setAge] = useState('');
  const [rate, setRate] = useState({ ...INITIAL_RATES });
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [submittedPayload, setSubmittedPayload] = useState(null);
  const [apiStatusNote, setApiStatusNote] = useState('');

  useEffect(() => {
    document.title = 'Form Review - Harapan Djaja Signature';
  }, []);

  const umurValid = age === '' || (Number(age) >= 10 && Number(age) <= 90);
  const ageError = umurValid ? '' : 'Umur harus antara 10 hingga 90 tahun.';
  const adaIsi = ASPEK.some(([k]) => rate[k]) || comment.trim() !== '';
  const bolehKirim = adaIsi && umurValid;

  const handleToggleGender = (value) => {
    setGender((prev) => (prev === value ? 'tidak_dijawab' : value));
  };

  const handleAgeChange = (e) => {
    setAge(e.target.value.replace(/\D/g, '').slice(0, 2));
  };

  const handleToggleStar = (kunci, n) => {
    setRate((prev) => ({ ...prev, [kunci]: prev[kunci] === n ? null : n }));
  };

  const buildPayload = () => {
    const umurNum = parseInt(age, 10);
    return {
      submitted_at: new Date().toISOString(),
      source: 'qr',
      gender,
      age: umurNum >= 10 && umurNum <= 90 ? umurNum : null,
      ratings: { ...rate },
      comment: comment.trim() || null,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bolehKirim || submitting) return;
    setErrorMsg('');
    const data = buildPayload();

    if (PROTOTIPE) {
      setSubmittedPayload(data);
      setApiStatusNote('Mode prototipe: belum terhubung ke API, data tidak dikirim ke mana pun.');
      setSubmitted(true);
      window.scrollTo(0, 0);
      return;
    }

    setSubmitting(true);
    const batal = new AbortController();
    const timer = setTimeout(() => batal.abort(), BATAS_WAKTU_MS);

    try {
      const res = await fetch(`${VOC_API}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: batal.signal,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw Object.assign(new Error('gagal'), { status: res.status, body });
      }
      setSubmittedPayload(data);
      setApiStatusNote(`Terkirim ke ${VOC_API}/reviews`);
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err) {
      setErrorMsg(pesanGagal(err.status || 0, err.body));
    } finally {
      clearTimeout(timer);
      setSubmitting(false);
    }
  };

  const handleResetPrototype = () => {
    setGender('tidak_dijawab');
    setAge('');
    setRate({ ...INITIAL_RATES });
    setComment('');
    setErrorMsg('');
    setSubmittedPayload(null);
    setApiStatusNote('');
    setSubmitted(false);
  };

  return (
    <div className="qr-form-page">
      <div className="qr-wrap">
        {PROTOTIPE && (
          <p className="qr-note">
            Mode prototipe: belum terhubung ke API. Tampilan di ponsel pelanggan setelah memindai QR di meja.
          </p>
        )}

        <div className="qr-phone">
          {!submitted ? (
            <form onSubmit={handleSubmit} noValidate>
              <div className="qr-head">
                <small>Kedai Harapan Djaja Signature, Gunung Anyar</small>
                <h1>Bagaimana pengalamanmu hari ini?</h1>
              </div>

              <div className="qr-body">
                <div>
                  <p className="qr-q">Gender</p>
                  <div className="qr-opts" role="group" aria-label="Gender">
                    <button
                      type="button"
                      aria-pressed={gender === 'laki-laki'}
                      onClick={() => handleToggleGender('laki-laki')}
                    >
                      Laki-laki
                    </button>
                    <button
                      type="button"
                      aria-pressed={gender === 'perempuan'}
                      onClick={() => handleToggleGender('perempuan')}
                    >
                      Perempuan
                    </button>
                  </div>
                </div>

                <div>
                  <p className="qr-q">Umur</p>
                  <div className="qr-age">
                    <input
                      type="text"
                      className="qr-age-input"
                      inputMode="numeric"
                      maxLength={2}
                      value={age}
                      onChange={handleAgeChange}
                      placeholder="Umur (10–90)"
                      aria-label="Umur dalam tahun, 10 sampai 90"
                      aria-describedby="ageErr"
                    />
                    <span className="qr-priv">tahun</span>
                    <div className="qr-agee" id="ageErr" role="alert">
                      {ageError}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="qr-q">Beri bintang untuk tiap aspek</p>
                  <div className="qr-asp">
                    {ASPEK.map(([kunci, nama]) => {
                      const nilai = rate[kunci];
                      return (
                        <div key={kunci}>
                          <div className="qr-arow">
                            <span className="n">{nama}</span>
                            <div className="qr-st" role="radiogroup" aria-label={`Bintang ${nama}`}>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  role="radio"
                                  aria-checked={n === nilai}
                                  aria-label={`${n} dari 5`}
                                  className={Boolean(nilai && n <= nilai) ? 'on' : ''}
                                  onClick={() => handleToggleStar(kunci, n)}
                                >
                                  <StarIcon />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="qr-hint">{nilai ? LABEL[nilai] : ''}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="qr-q">Ceritakan pengalamanmu</p>
                  <textarea
                    className="qr-textarea"
                    maxLength={500}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Bagikan detail pengalamanmu di kedai ini"
                  />
                  <div className="qr-cc">
                    <span>{comment.length}</span>/500
                  </div>
                </div>

                {errorMsg && (
                  <div className="qr-err" role="alert">
                    {errorMsg}
                  </div>
                )}

                <button className="qr-btn" type="submit" disabled={!bolehKirim || submitting}>
                  {submitting ? 'Mengirim...' : 'Kirim ulasan'}
                </button>

                <p className="qr-priv">
                  Umur dan gender boleh dikosongkan. Dipakai hanya untuk memahami pelanggan secara umum, tidak ada nama atau nomor telepon yang diminta.
                </p>
              </div>
            </form>
          ) : (
            <div className="qr-thanks">
              <div className="qr-tick" aria-hidden="true">✓</div>
              <h2>Terima kasih atas ulasanmu</h2>
              <p>Masukanmu membantu kami memperbaiki kedai. Sampai jumpa lagi di Harapan Djaja.</p>

              {PROTOTIPE && (
                <>
                  <button className="qr-btn g" type="button" onClick={handleResetPrototype}>
                    Isi ulasan lagi (untuk coba prototipe)
                  </button>
                  <details>
                    <summary>Data yang dikirim ke API (untuk tim)</summary>
                    <p style={{ margin: '8px 0 0' }}>{apiStatusNote}</p>
                    <pre>{JSON.stringify(submittedPayload, null, 2)}</pre>
                  </details>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
