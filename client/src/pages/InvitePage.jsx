import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import AppNavbar from "../components/AppNavbar";
import InviteItem from "../components/InviteItem";
import { useAuth } from "../hooks/useAuth";
import { useInvites } from "../hooks/useInvites";
import { useLessons } from "../hooks/useLessons";
import { usePathways } from "../hooks/usePathways";
import { createInvite } from "../services/inviteService";
import { consumeJustLoggedOut } from "../utils/logoutFlag";
import { showErrorToast, showSuccessToast } from "../utils/toast";

export default function InvitePage() {
  const { user, token } = useAuth();
  const {
    incoming,
    outgoing,
    status,
    error,
    socketReady,
    fetchInvites,
    connectSocket,
    sendInvite,
  } = useInvites();
  const { pathways } = usePathways();
  const { lessons, fetchLessons } = useLessons();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoading = status === "idle" || status === "loading";

  const preselectedLesson = Number(searchParams.get("lesson")) || "";
  const [pathwayId, setPathwayId] = useState("");
  const [lessonId, setLessonId] = useState(preselectedLesson);
  const [toUsername, setToUsername] = useState("");
  const [sending, setSending] = useState(false);

  // Guard + load awal REST + connect socket.
  useEffect(() => {
    if (!token) {
      if (!consumeJustLoggedOut()) {
        showErrorToast("Silakan masuk dulu untuk melihat undangan.");
      }
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    (async () => {
      const result = await fetchInvites(token);
      if (!cancelled && !result.ok) {
        showErrorToast(result.message);
      }
    })();

    connectSocket(token, user);

    return () => {
      cancelled = true;
    };
  }, [token, user, fetchInvites, connectSocket, navigate]);

  // Ambil lessons saat dropdown level dipilih.
  useEffect(() => {
    if (!token || !pathwayId) {
      return;
    }

    (async () => {
      const result = await fetchLessons(Number(pathwayId), token);
      if (!result.ok) {
        showErrorToast(result.message);
      }
    })();
  }, [token, pathwayId, fetchLessons]);

  const pendingIncoming = incoming.filter((item) => item.status === "pending").length;
  const pendingOutgoing = outgoing.filter((item) => item.status === "pending").length;

  async function handleSubmit(event) {
    event.preventDefault();

    if (!lessonId) {
      showErrorToast("Pilih lesson dulu sebelum mengirim undangan.");
      return;
    }

    const cleanUsername = toUsername.trim();

    if (!cleanUsername) {
      showErrorToast("Isi username partner dulu.");
      return;
    }

    setSending(true);

    // Jalur utama: socket realtime. Fallback: REST bila socket belum siap.
    const socketResult = sendInvite({
      lesson_id: Number(lessonId),
      to_username: cleanUsername,
    });

    if (!socketResult.ok) {
      try {
        await createInvite(token, {
          lessonId: Number(lessonId),
          toUsername: cleanUsername,
        });
        showSuccessToast(`Undangan untuk @${cleanUsername} terkirim.`);
        setToUsername("");
        await fetchInvites(token);
      } catch (err) {
        showErrorToast(
          err.response?.data?.message || "Gagal mengirim undangan. Coba lagi.",
        );
      } finally {
        setSending(false);
      }
      return;
    }

    showSuccessToast(`Undangan untuk @${cleanUsername} terkirim.`);
    setToUsername("");
    setSending(false);
  }

  return (
    <div className="bg-slate-100 min-h-screen font-sans text-slate-800">
      <AppNavbar active="invite" />

      {/* KONTEN UNDANGAN */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
          Latihan Berdua + AI Anna
        </p>
        <h1 className="font-display font-bold text-3xl sm:text-4xl mt-1">
          Undang Partner &#128101;
        </h1>
        <p className="text-sm font-semibold text-slate-500 mt-1">
          Pilih level lalu lesson, undang lewat username, dan pantau statusnya
          realtime — tanpa refresh.
          {socketReady ? "" : " (menghubungkan realtime...)"}
        </p>

        <div className="grid gap-6 mt-6 lg:grid-cols-[340px_1fr]">
          <InviteForm
            pathways={pathways}
            lessons={lessons}
            pathwayId={pathwayId}
            setPathwayId={setPathwayId}
            lessonId={lessonId}
            setLessonId={setLessonId}
            toUsername={toUsername}
            setToUsername={setToUsername}
            sending={sending}
            onSubmit={handleSubmit}
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <InviteList
              title="&#128229; Undangan Masuk"
              badgeClass="badge bg-rose-500 text-white border-none font-extrabold text-[10px]"
              pending={pendingIncoming}
              isLoading={isLoading}
              status={status}
              error={error}
              emptyText="Belum ada undangan masuk."
              items={incoming}
              variant="incoming"
              onRetry={() => fetchInvites(token)}
            />
            <InviteList
              title="&#128228; Undangan Terkirim"
              badgeClass="badge badge-warning badge-xs font-bold"
              pending={pendingOutgoing}
              isLoading={isLoading}
              status={status}
              error={error}
              emptyText="Belum ada undangan terkirim."
              items={outgoing}
              variant="outgoing"
              onRetry={() => fetchInvites(token)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function InviteForm(props) {
  const {
    pathways,
    lessons,
    pathwayId,
    setPathwayId,
    lessonId,
    setLessonId,
    toUsername,
    setToUsername,
    sending,
    onSubmit,
  } = props;

  return (
    <section className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
      <h2 className="font-display font-bold text-xl text-slate-800">
        &#128172; Kirim Undangan
      </h2>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Pilih Level
          </span>
          <select
            value={pathwayId}
            onChange={(event) => {
              setPathwayId(event.target.value);
              setLessonId("");
            }}
            className="select w-full mt-1 rounded-2xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none text-sm font-semibold text-slate-800"
          >
            <option value="">— Pilih level —</option>
            {pathways.map((pathway) => (
              <option key={pathway.id} value={pathway.id}>
                Level {pathway.level} • {pathway.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Pilih Lesson
          </span>
          <select
            value={lessonId}
            onChange={(event) => setLessonId(event.target.value)}
            disabled={!pathwayId}
            className="select w-full mt-1 rounded-2xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none text-sm font-semibold text-slate-800 disabled:bg-slate-50"
          >
            <option value="">
              {pathwayId ? "— Pilih lesson —" : "Pilih level dulu"}
            </option>
            {lessons.map((lesson) => (
              <option
                key={lesson.id}
                value={lesson.id}
                disabled={lesson.status === "locked"}
              >
                {lesson.title}
                {lesson.status === "locked" ? " (terkunci)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Username Partner
          </span>
          <input
            type="text"
            value={toUsername}
            onChange={(event) => setToUsername(event.target.value)}
            placeholder="cth: sari_21"
            autoComplete="off"
            className="input w-full h-12 mt-1 rounded-2xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none text-sm font-semibold text-slate-800 pl-4 placeholder:text-slate-300"
          />
        </label>

        <button
          type="submit"
          disabled={sending}
          className="btn w-full bg-sky-500 hover:bg-sky-600 text-white font-display border-b-4 border-sky-700 active:border-b-0 rounded-2xl shadow h-12 disabled:bg-sky-300 disabled:border-sky-400"
        >
          {sending ? (
            <>
              <span className="loading loading-dots loading-sm" />
              Mengirim...
            </>
          ) : (
            <>Kirim Undangan &#128640;</>
          )}
        </button>
      </form>
    </section>
  );
}

function InviteList(props) {
  const {
    title,
    badgeClass,
    pending,
    isLoading,
    status,
    error,
    emptyText,
    items,
    variant,
    onRetry,
  } = props;

  return (
    <section className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="font-display font-bold text-xl text-slate-800">{title}</h2>
        <span className={badgeClass}>{pending} pending</span>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((key) => (
            <div
              key={key}
              className="h-16 bg-slate-50 border-2 border-slate-200 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : status === "error" ? (
        <div className="text-center py-6">
          <p className="text-xs font-bold text-slate-400">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-sm mt-3 bg-emerald-500 hover:bg-emerald-600 text-white font-display border-b-2 border-emerald-700 rounded-xl"
          >
            Coba lagi
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs font-bold text-slate-400 text-center py-6">
          {emptyText}
        </p>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
          {items.map((invite) => (
            <InviteItem key={invite.id} invite={invite} variant={variant} />
          ))}
        </div>
      )}
    </section>
  );
}

