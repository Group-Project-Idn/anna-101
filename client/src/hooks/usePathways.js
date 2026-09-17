import { useContext } from "react";
import { PathwayContext } from "../context/PathwayContext";

export function usePathways() {
  const context = useContext(PathwayContext);

  if (!context) {
    throw new Error("usePathways harus dipakai di dalam PathwayProvider.");
  }

  return context;
}
