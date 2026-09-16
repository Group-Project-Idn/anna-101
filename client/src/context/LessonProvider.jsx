import { useCallback, useMemo, useRef, useState } from "react";
import { LessonContext } from "./LessonContext";
import { fetchLessons as fetchLessonsRequest } from "../services/lessonService";

export default function LessonProvider({ children }) {
  const [lessons, setLessons] = useState([]);
  const [pathwayId, setPathwayId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  // Mencegah double-fetch saat React StrictMode menjalankan effect 2x di dev.
  const requestRef = useRef(null);

  const fetchLessons = useCallback(async (id, token) => {
    if (requestRef.current === `${id}:${token}`) {
      return { ok: true };
    }
    requestRef.current = `${id}:${token}`;
    setPathwayId(id);
    setStatus("loading");
    setError(null);

    try {
      const list = await fetchLessonsRequest(id, token);
      setLessons(list ?? []);
      setStatus("success");
      return { ok: true };
    } catch (err) {
      requestRef.current = null;
      const message =
        err.response?.data?.message ||
        "Gagal memuat lessons. Pastikan server aktif lalu coba lagi.";
      setError(message);
      setStatus("error");
      return { ok: false, message };
    }
  }, []);

  const value = useMemo(
    () => ({ lessons, pathwayId, status, error, fetchLessons }),
    [lessons, pathwayId, status, error, fetchLessons],
  );

  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}
