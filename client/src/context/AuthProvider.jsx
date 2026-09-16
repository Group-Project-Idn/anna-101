import { useCallback, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import { loginUser, registerUser } from "../services/authService";

const TOKEN_KEY = "anna101_token";
const USER_KEY = "anna101_user";

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [status, setStatus] = useState("idle");

  const register = useCallback(async (form) => {
    setStatus("loading");

    try {
      const session = await registerUser(form);

      setUser(session.user ?? null);
      if (session.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(session.user));
      }

      setToken(session.token ?? null);
      if (session.token) {
        localStorage.setItem(TOKEN_KEY, session.token);
      }

      setStatus("success");
      return { ok: true, user: session.user };
    } catch (error) {
      setStatus("error");
      const message =
        error.response?.data?.message ||
        "Gagal mendaftar. Pastikan server aktif lalu coba lagi.";
      return { ok: false, message };
    }
  }, []);

  const login = useCallback(async (form) => {
    setStatus("loading");

    try {
      const session = await loginUser(form);

      setUser(session.user ?? null);
      if (session.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(session.user));
      }

      setToken(session.token ?? null);
      if (session.token) {
        localStorage.setItem(TOKEN_KEY, session.token);
      }

      setStatus("success");
      return { ok: true, user: session.user };
    } catch (error) {
      setStatus("error");
      const message =
        error.response?.data?.message ||
        "Gagal masuk. Periksa email dan password lalu coba lagi.";
      return { ok: false, message };
    }
  }, []);

  const value = useMemo(
    () => ({ user, token, status, register, login }),
    [user, token, status, register, login],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
