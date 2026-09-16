import { useState } from "react";
import { Link, useNavigate } from "react-router";
import AuthNavbar from "../components/AuthNavbar";
import FormField from "../components/FormField";
import { useAuth } from "../hooks/useAuth";
import { validateLoginForm } from "../utils/validation";
import { showErrorToast, showSuccessToast } from "../utils/toast";

// Nilai awal sengaja disamakan dengan template /static/login.html
// supaya tampilannya identik. Kosongkan object ini kalau mau form mulai blank.
const INITIAL_FORM = {
  email: "budi@mail.com",
  password: "secret123",
};

const FEATURE_PILLS = [
  { icon: "\u{1F4DA}", label: "Level 1\u20134" },
  { icon: "\u{1F3AF}", label: "CEFR A1\u2013B2" },
  { icon: "\u{1F465}", label: "2 user + Anna" },
];

export default function LoginPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const isSubmitting = status === "loading";

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function handleBlur(event) {
    const { name } = event.target;
    const fieldError = validateLoginForm(form)[name];
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateLoginForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      showErrorToast("Periksa kembali data yang kamu isi.");
      return;
    }

    const result = await login(form);

    if (!result.ok) {
      showErrorToast(result.message);
      return;
    }

    showSuccessToast(`Selamat datang lagi, ${result.user.name}!`);
    navigate("/pathways");
  }
  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-800">
      <AuthNavbar />

      {/* KONTEN LOGIN */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12 grid lg:grid-cols-2 gap-8 items-center">
        {/* Sisi Kiri: Penjelasan Produk */}
        <section>
          <span className="badge bg-amber-400 text-slate-900 border-none font-extrabold text-[11px] px-3 py-2">
            &#129302; AI TEACHER BAHASA INGGRIS
          </span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl leading-tight mt-4">
            Latihan percakapan <span className="text-emerald-600">berdua</span>,
            dibimbing Anna.
          </h1>
          <p className="mt-3 text-sm sm:text-base font-semibold text-slate-500 max-w-md">
            Kurikulum American English Level 1&#8211;4 dengan cara yang seru: dua
            orang belajar, satu room chat live, dan AI yang membimbing sekaligus
            menilai.
          </p>

          <div className="flex flex-wrap gap-2 mt-5 text-[11px] font-bold text-slate-600">
            {FEATURE_PILLS.map((pill) => (
              <span
                key={pill.label}
                className="bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5"
              >
                {pill.icon} {pill.label}
              </span>
            ))}
          </div>

          {/* Contoh dialog demo yang nanti digenerate Anna */}
          <div className="mt-6 bg-gradient-to-r from-amber-50 to-sky-50 border-2 border-amber-300 rounded-3xl p-4 shadow-sm max-w-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
              Contoh dialog demo dari Anna
            </p>
            <p className="font-display font-semibold text-lg text-slate-800 mt-1 italic">
              "Hi Sari! Do you like watching football on weekends?"
            </p>
            <p className="text-[10px] font-bold text-slate-400 mt-2">
              Lesson 5 &#8226; Talking About Sports
            </p>
          </div>
        </section>

        {/* Sisi Kanan: Form Login */}
        <section className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
          <h2 className="font-display font-bold text-2xl text-slate-800">
            Masuk ke akunmu
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-1">
            Lanjutkan pathway dan undang partner latihanmu.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <FormField
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              accent="emerald"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
            />
            <FormField
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              accent="emerald"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn w-full bg-emerald-500 hover:bg-emerald-600 text-white font-display border-b-4 border-emerald-700 active:border-b-0 rounded-2xl shadow h-12 disabled:bg-emerald-300 disabled:border-emerald-400"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-dots loading-sm" />
                  Masuk...
                </>
              ) : (
                <>Masuk &#128640;</>
              )}
            </button>
          </form>

          <p className="text-xs font-bold text-slate-500 mt-4 text-center">
            Belum punya akun?{" "}
            <Link to="/register" className="text-emerald-700 underline">
              Daftar sekarang
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
