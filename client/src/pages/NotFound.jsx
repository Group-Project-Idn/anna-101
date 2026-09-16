import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-800 flex flex-col items-center justify-center gap-3 px-4">
      <h1 className="font-display font-bold text-9xl text-slate-300">404</h1>
      <p className="text-lg font-semibold text-slate-500">
        Halaman yang kamu cari tidak ditemukan.
      </p>
      <Link
        to="/register"
        className="btn bg-sky-500 hover:bg-sky-600 text-white font-display border-b-4 border-sky-700 active:border-b-0 rounded-2xl shadow mt-4"
      >
        Kembali ke Register
      </Link>
    </div>
  );
}
