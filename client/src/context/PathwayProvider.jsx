import { useCallback, useMemo, useRef, useState } from "react";
import { PathwayContext } from "./PathwayContext";
import {
  fetchPathways as fetchPathwaysRequest,
  fetchPathwayProgress,
} from "../services/pathwayService";

export default function PathwayProvider({ children }) {
  const [pathways, setPathways] = useState([]);
  const [progressByPathway, setProgressByPathway] = useState({});
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

      // Progress per pathway dari server (GET /api/pathways/progress) —
      // sumber angka "x dari y lesson selesai" dan label CTA. try/catch
      // sendiri supaya kegagalan progress tidak menggagalkan daftar pathways.
      try {
        const progress = await fetchPathwayProgress(token);
        const mapped = {};

        for (const item of Array.isArray(progress) ? progress : []) {
          if (item?.pathway_id != null) {
            mapped[item.pathway_id] = item;
          }
        }

        setProgressByPathway(mapped);
      } catch {
        setProgressByPathway({});
      }

      setStatus("success");
      // Lepas guard supaya fetch berikutnya (navigasi balik ke /pathways
      // setelah menyelesaikan lesson, tombol coba lagi) tidak jadi no-op —
      // tanpa ini angka progress tetap basi walau lesson sudah selesai.
      requestRef.current = false;
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
    () => ({ pathways, progressByPathway, status, error, fetchPathways }),
    [pathways, progressByPathway, status, error, fetchPathways],
  );

  return <PathwayContext.Provider value={value}>{children}</PathwayContext.Provider>;
}
