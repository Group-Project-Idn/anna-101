import { useContext } from "react";
import { LessonContext } from "../context/LessonContext";

export function useLessons() {
  const context = useContext(LessonContext);

  if (!context) {
    throw new Error("useLessons harus dipakai di dalam LessonProvider.");
  }

  return context;
}
