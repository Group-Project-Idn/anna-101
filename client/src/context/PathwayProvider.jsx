import { useCallback, useMemo, useRef, useState } from "react";
import { PathwayContext } from "./PathwayContext";
import { fetchPathways as fetchPathwaysRequest } from "../services/pathwayService";

export default function PathwayProvider({ children }) {
  const [pathways, setPathways] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  // Mencegah double-fetch saat React StrictMode menjalankan effect 2x di dev.
  const requestRef = useRef(false);

  const fetchPathways = useCallback(async (token) => {
    if (requestRef.current) {
      return { ok: true };
    }
    requestRef.current = true;
    setStatus("loading");
    setError(null);

    try {
      const list = await fetchPathwaysRequest(token);
      setPathways(list ?? []);
      setStatus("success");
      return { ok: true };
    } catch (err) {
      requestRef.current = false;
      const message =
        err.response?.data?.message ||
        "Gagal memuat pathways. Pastikan server aktif lalu coba lagi.";
      setError(message);
      setStatus("error");
      return { ok: false, message };
    }
  }, []);

  const value = useMemo(
    () => ({ pathways, status, error, fetchPathways }),
    [pathways, status, error, fetchPathways],
  );

  return <PathwayContext.Provider value={value}>{children}</PathwayContext.Provider>;
}
