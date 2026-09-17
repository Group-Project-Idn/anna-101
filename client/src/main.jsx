import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "toastify-js/src/toastify.css";
import App from "./App.jsx";
import AuthProvider from "./context/AuthProvider.jsx";
import PathwayProvider from "./context/PathwayProvider.jsx";
import LessonProvider from "./context/LessonProvider.jsx";
import InviteProvider from "./context/InviteProvider.jsx";
import ChatProvider from "./context/ChatProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <PathwayProvider>
        <LessonProvider>
          <InviteProvider>
            <ChatProvider>
              <App />
            </ChatProvider>
          </InviteProvider>
        </LessonProvider>
      </PathwayProvider>
    </AuthProvider>
  </StrictMode>,
);
