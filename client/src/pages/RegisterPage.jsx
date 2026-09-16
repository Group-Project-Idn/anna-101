import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import AuthNavbar from "../components/AuthNavbar";
import FormField from "../components/FormField";
import { useAuth } from "../hooks/useAuth";
import { validateRegisterForm } from "../utils/validation";
import { showErrorToast, showSuccessToast } from "../utils/toast";

// Form mulai kosong dengan placeholder — value tidak di-prefill lagi.
const INITIAL_FORM = {
  name: "",
  username: "",
  email: "",
  password: "",
};

const BENEFITS = [
  {
    icon: "\u{1F4DA}",
    title: "Pathway terstruktur",
    description: "Level 1-4 American English, lesson terbuka berurutan.",
  },
  {
    icon: "\u{1F465}",
    title: "Latihan dengan partner",
    description: "Undang teman by username, bertemu di room chat live.",
  },
  {
    icon: "\u{1F916}",
    title: "Anna membimbing & menilai",
    description: "Demo dialog, saran jawaban, dan evaluasi akhir sesi.",
  },
];

export default function RegisterPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const { token, register, status } = useAuth();
  const navigate = useNavigate();
  const isSubmitting = status === "loading";

  // Sudah login = pathways adalah home, jangan tampilkan form lagi.
  if (token) {
    return <Navigate to="/pathways" replace />;
  }

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
    const fieldError = validateRegisterForm(form)[name];
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateRegisterForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      showErrorToast("Periksa kembali data yang kamu isi.");
      return;
    }

    const result = await register(form);

    if (!result.ok) {
      showErrorToast(result.message);
      return;
    }

    showSuccessToast(`Akun @${result.user.username} berhasil dibuat.`);
    navigate("/pathways");
  }

  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-800">
      <AuthNavbar />

      {/* KONTEN REGISTER */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12 grid lg:grid-cols-2 gap-8 items-start">
        {/* Sisi Kiri: Cara Kerja Belajar */}
        <section>
          <span className="badge bg-sky-400 text-white border-none font-extrabold text-[11px] px-3 py-2">
            &#128640; MULAI DARI LEVEL 1 • CEFR A1
          </span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl leading-tight mt-4">
            Dua orang belajar.
            <br />
            <span className="text-sky-600">Satu percakapan.</span>
          </h1>
          <p className="mt-3 text-sm font-semibold text-slate-500 max-w-md">
            Username kamu bersifat unik — partner akan mengundangmu lewat
            username tersebut.
          </p>

          <div className="mt-6 space-y-3 max-w-md">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-sm flex items-start gap-3"
              >
                <span className="text-xl">{benefit.icon}</span>
                <div>
                  <p className="text-xs font-extrabold text-slate-700">
                    {benefit.title}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* Sisi Kanan: Form Register */}
        <section className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
          <h2 className="font-display font-bold text-2xl text-slate-800">
            Buat akun baru
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-1">
            Gratis, hanya butuh 4 data di bawah ini.
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-5 grid sm:grid-cols-2 gap-4"
          >
            <FormField
              id="name"
              label="Nama"
              placeholder="Nama lengkapmu"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.name}
              autoComplete="name"
            />
            <FormField
              id="username"
              label="Username"
              placeholder="huruf kecil tanpa spasi"
              value={form.username}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.username}
              autoComplete="username"
            />
            <FormField
              id="email"
              label="Email"
              type="email"
              placeholder="nama@email.com"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              autoComplete="email"
              className="sm:col-span-2"
            />
            <FormField
              id="password"
              label="Password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
              autoComplete="new-password"
              className="sm:col-span-2"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn w-full bg-sky-500 hover:bg-sky-600 text-white font-display border-b-4 border-sky-700 active:border-b-0 rounded-2xl shadow h-12 sm:col-span-2 disabled:bg-sky-300 disabled:border-sky-400"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-dots loading-sm"></span>
                  Mendaftarkan...
                </>
              ) : (
                <>Daftar Sekarang &#10024;</>
              )}
            </button>
          </form>

          <p className="text-xs font-bold text-slate-500 mt-4 text-center">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-sky-700 underline">
              Masuk di sini
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
