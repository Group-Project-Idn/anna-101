import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "toastify-js/src/toastify.css";
import App from "./App.jsx";
import AuthProvider from "./context/AuthProvider.jsx";
import PathwayProvider from "./context/PathwayProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <PathwayProvider>
        <App />
      </PathwayProvider>
    </AuthProvider>
  </StrictMode>,
);
