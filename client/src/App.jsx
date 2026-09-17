import { BrowserRouter, Route, Routes } from "react-router";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import PathwaysPage from "./pages/PathwaysPage";
import LessonsPage from "./pages/LessonsPage";
import InvitePage from "./pages/InvitePage";
import ChatRoomPage from "./pages/ChatRoomPage";
import EvaluationPage from "./pages/EvaluationPage";
import NotFound from "./pages/NotFound";
import HomeRoute from "./components/HomeRoute";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* pathways adalah home — / mengarah ke sana, guard token di dalam */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pathways" element={<PathwaysPage />} />
          <Route path="/lessons/:id" element={<LessonsPage />} />
          <Route path="/invite" element={<InvitePage />} />
          <Route path="/chat-room/:id" element={<ChatRoomPage />} />
          <Route path="/evaluation/:id" element={<EvaluationPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
