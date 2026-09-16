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

      // Progress endpoint masih usulan server — gagal = diam-diam pakai dummy.
      // try/catch sendiri supaya 404 progress tidak menggagalkan pathways.
      try {
        const progress = await fetchPathwayProgress(token);
        const mapped = {};

        for (const item of progress ?? []) {
          if (item?.pathway_id != null) {
            mapped[item.pathway_id] = item;
          }
        }

        setProgressByPathway(mapped);
      } catch {
        setProgressByPathway({});
      }

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
    () => ({ pathways, progressByPathway, status, error, fetchPathways }),
    [pathways, progressByPathway, status, error, fetchPathways],
  );

  return <PathwayContext.Provider value={value}>{children}</PathwayContext.Provider>;
}
