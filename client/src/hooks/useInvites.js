import { useContext } from "react";
import { InviteContext } from "../context/InviteContext";

export function useInvites() {
  const context = useContext(InviteContext);

  if (!context) {
    throw new Error("useInvites harus dipakai di dalam InviteProvider.");
  }

  return context;
}
