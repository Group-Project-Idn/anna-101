import { Link, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

export default function NotFound() {
  const navigate = useNavigate();
  const { token } = useAuth();

  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-800 flex flex-col items-center justify-center gap-3 px-4">
      <h1 className="font-display font-bold text-9xl text-slate-300">404</h1>
      <p className="text-lg font-semibold text-slate-500">
        Halaman yang kamu cari tidak ditemukan.
      </p>

      {token ? (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <button
            type="button"
            onClick={() => navigate("/pathways")}
            className="btn bg-sky-500 hover:bg-sky-600 text-white font-display border-b-4 border-sky-700 active:border-b-0 rounded-2xl shadow"
          >
            Kembali ke Pathways
          </button>
          <button
            type="button"
            onClick={() =>
              window.history.length > 1
                ? navigate(-1)
                : navigate("/pathways")
            }
            className="btn bg-white hover:bg-slate-100 text-slate-600 border-2 border-slate-200 rounded-2xl font-display shadow"
          >
            Halaman Sebelumnya
          </button>
        </div>
      ) : (
        <Link
          to="/login"
          className="btn bg-sky-500 hover:bg-sky-600 text-white font-display border-b-4 border-sky-700 active:border-b-0 rounded-2xl shadow mt-4"
        >
          Kembali ke Login
        </Link>
      )}
    </div>
  );
}
