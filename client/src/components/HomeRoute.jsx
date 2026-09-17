import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

/**
 * Route / — pathways adalah home.
 * Ada token -> /pathways, tidak ada -> /register.
 */
export default function HomeRoute() {
  const { token } = useAuth();

  return <Navigate to={token ? "/pathways" : "/register"} replace />;
}
