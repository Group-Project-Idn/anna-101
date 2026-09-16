const { Server } = require('socket.io');
const { Op } = require('sequelize');
const {
  Conversation,
  ConversationParticipant,
  ConversationInvite,
  Lesson,
  Message,
  SessionEvaluation,
  User,
  UserLessonProgress,
  sequelize,
} = require('../models');
const { verifyToken } = require('../helpers/jwt');
const ControllerInvite = require('../controllers/controllerInvite');

let io = null;

// userId -> Set<socketId>, dipakai untuk emit per-user di 'session:evaluation'.
const userSockets = new Map();
// conversationId -> { lines, readyUsers } — demo script sementara, TIDAK disimpan ke DB.
const demoScripts = new Map();
// conversationId yang sudah melewati fase demo, biar demo tidak muncul lagi.
const demoDone = new Set();

const DEMO_DIALOGUES = [
  {
    a: [
      'Hi! I am your practice partner for this demo session.',
      'This demo shows how the real chat will look, but it is not saved.',
      'Let us talk about hobbies. What do you usually do in your free time?',
      'I enjoy reading novels and trying new recipes.',
      'What kind of novels do you like?',
      'Do you play football every weekend?',
      'How long have you been playing?',
      'That is great! Exercise is really important.',
      'I jog around the block a few times a week.',
      'After this demo we can start the real chat. Hit ready!',
    ],
    b: [
      'Hi! Nice to meet you, I am ready to practice English.',
      'Got it! So what should we talk about?',
      'I like playing football and watching movies. How about you?',
      'That sounds fun! Maybe you can recommend a novel later.',
      'Mostly mystery stories. I cannot stop reading once I start.',
      'Yes, with my friends every Sunday morning.',
      'For about five years now. It keeps me healthy.',
      'Totally agree. Do you do any sports?',
      'Awesome! Maybe we can jog together someday.',
      'Perfect, I am ready whenever you are!',
    ],
  },
  {
    a: [
      'Hello! Welcome to Anna practice room.',
      'This demo is temporary and will not be stored in our history.',
      'Let us talk about sports. Do you follow any sports?',
      'Really? Which team is your favorite?',
      'I prefer watching badminton, it is very fast!',
      'Do you play basketball yourself?',
      'That is a good routine. How did you start?',
      'Nice! Sports are a great way to make friends.',
      'Thank you! After this demo we can chat for real.',
      'Great! Hit ready and let us practice together.',
    ],
    b: [
      'Hello! Thanks, I am excited to practice English here.',
      'Understood! What is the topic for today?',
      'Yes, I follow basketball a lot.',
      'I support the local university team. What about you?',
      'True, badminton players have amazing reflexes.',
      'Yes, twice a week after work.',
      'My friends invited me to join their team.',
      'Definitely! Do you play badminton too?',
      'Sounds good, I am ready to start.',
      'Let us do it!',
    ],
  },
];

const SUGGESTIONS = [
  "Try: 'Yes, I love football!'",
  "Try: 'That sounds interesting, tell me more!'",
  "Try: 'I usually play badminton on weekends.'",
  "Try: 'What do you like to do in your free time?'",
  "Try: 'I totally agree with you!'",
  "Try: 'Wow, that is really cool!'",
];

const STRENGTHS = [
  'Good vocabulary usage and natural expressions.',
  'Confident speaking with clear sentence structure.',
  'Great conversational flow and quick responses.',
];

const EVALUATIONS = [
  'You kept the conversation going smoothly and used many useful phrases. Next time, try adding more details to your answers.',
  'Your responses were clear and on topic. To improve, practice using past tense more consistently.',
  'You communicated your ideas well. Try asking more follow-up questions to keep the chat engaging.',
];

const emitError = (socket, message) => {
  socket.emit('error', { message });
};

const sendToUser = (userId, event, payload) => {
  const sockets = userSockets.get(userId);
  if (!sockets) return;

  sockets.forEach((socketId) => {
    io.to(socketId).emit(event, payload);
  });
};

// Room "invite:pending:{id}" bersifat sementara (kontrak api-contract.md §5):
// di-join selama user punya invite pending, di-leave saat sudah tidak ada.
const pendingRoomFor = (userId) => `invite:pending:${userId}`;

const socketsOfUser = (userId) => {
  const socketIds = userSockets.get(userId);
  if (!socketIds) return [];

  return [...socketIds]
    .map((id) => io.sockets.sockets.get(id))
    .filter(Boolean);
};

const joinPendingRoom = (userId) => {
  socketsOfUser(userId).forEach((socket) => socket.join(pendingRoomFor(userId)));
};

const leavePendingRoomIfNoPending = async (userId) => {
  const pending = await ConversationInvite.count({
    where: {
      status: 'pending',
      [Op.or]: [{ to_user_id: userId }, { from_user_id: userId }],
    },
  });

  if (pending === 0) {
    socketsOfUser(userId).forEach((socket) => socket.leave(pendingRoomFor(userId)));
  }
};

// Payload invite:new sesuai kontrak — frontend meng-upsert list masuk/terkirim
// dari data ini, jadi bentuknya harus konsisten dengan GET /api/invites.
const buildInviteNewPayload = ({ invite, lesson, fromUser, toUser }) => ({
  id: invite.id,
  lesson_id: lesson.id,
  lesson_title: lesson.title,
  pathway_id: lesson.pathway ? lesson.pathway.id : null,
  pathway_level: lesson.pathway ? lesson.pathway.level : null,
  from_user_id: fromUser.id,
  from_username: fromUser.username,
  to_user_id: toUser.id,
  to_username: toUser.username,
  status: invite.status,
  created_at: invite.created_at,
});

const generateDemoScript = () => {
  const dialogue = DEMO_DIALOGUES[Math.floor(Math.random() * DEMO_DIALOGUES.length)];
  const lines = [];

  for (let i = 0; i < dialogue.a.length; i += 1) {
    lines.push({ speaker: 'A', text: dialogue.a[i] });
    lines.push({ speaker: 'B', text: dialogue.b[i] });
  }

  return lines;
};

const generateSuggestion = () => {
  return SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
};

const generateEvaluation = () => {
  const strengths = STRENGTHS[Math.floor(Math.random() * STRENGTHS.length)];
  const evaluation = EVALUATIONS[Math.floor(Math.random() * EVALUATIONS.length)];
  const score = 3 + Math.floor(Math.random() * 3); // 3 - 5

  return { strengths, evaluation, score };
};

// Conversation boleh diakses hanya oleh partisipannya — sama seperti controllerConversation.
const getConversationForUser = async (conversationId, userId) => {
  const conversation = await Conversation.findByPk(conversationId, {
    attributes: { exclude: ['user_id'] },
  });

  if (!conversation) throw new Error('Data not found');

  const participant = await ConversationParticipant.findOne({
    where: { conversation_id: conversationId, user_id: userId },
  });

  if (!participant) throw new Error("You don't have any access");

  return conversation;
};

const getParticipantIds = async (conversationId) => {
  const participants = await ConversationParticipant.findAll({
    where: { conversation_id: conversationId },
  });

  return participants.map((participant) => participant.user_id);
};

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  // Autentikasi JWT saat handshake — sama seperti middlewares/authentication.js.
  io.use(async (socket, next) => {
    try {
      const { authorization } = socket.handshake.headers;
      // Client (services/socket.js) mengirim auth.token dengan prefix "Bearer ",
      // sedangkan header authorization sudah di-split sebelumnya. Strip prefix
      // di sini supaya kedua bentuk diterima dan handshake tidak selalu gagal.
      const rawToken =
        (socket.handshake.auth && socket.handshake.auth.token) ||
        (authorization && authorization.split(' ')[1]) ||
        '';
      const token = rawToken.replace(/^Bearer\s+/i, '');

      if (!token) throw new Error('unauthorized');

      const payload = verifyToken(token);

      const user = await User.findByPk(payload.id);

      if (!user) throw new Error('unauthorized');

      socket.userId = user.id;
      socket.userName = user.name;

      next();
    } catch (error) {
      next(new Error('Please login first'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id} (user ${socket.userId})`);

    if (!userSockets.has(socket.userId)) {
      userSockets.set(socket.userId, new Set());
    }
    userSockets.get(socket.userId).add(socket.id);

    // Room personal "user:{id}" — tujuan event personal (invite:new,
    // invite:status) selama socket ini terhubung.
    socket.join(`user:${socket.userId}`);

    // Join room conversation -> kirim demo script kalau room masih fase demo.
    socket.on('conversation:join', async ({ conversationId }) => {
      try {
        if (!conversationId) return emitError(socket, 'conversationId is required');

        const conversation = await getConversationForUser(conversationId, socket.userId);

        socket.join(`conversation:${conversationId}`);

        if (!demoDone.has(conversationId) && conversation.status !== 'finished') {
          if (!demoScripts.has(conversationId)) {
            demoScripts.set(conversationId, {
              lines: generateDemoScript(),
              readyUsers: new Set(),
            });
          }

          socket.emit('demo:script', {
            conversationId,
            lines: demoScripts.get(conversationId).lines,
          });
        }
      } catch (error) {
        console.error('[Socket] conversation:join error:', error.message);
        emitError(socket, error.message);
      }
    });

    // ============ Invite realtime (kontrak api-contract.md §5) ============
    // Catatan: error bisnis (username tidak ada, lesson locked, dst) TIDAK
    // di-emit ke event 'error' karena client menganggap event itu masalah
    // koneksi. Error bisnis cukup lewat ack { ok: false, message } ke pengirim.

    // Gabung ke room personal + room pending bila masih punya invite pending.
    socket.on('invite:join', async ({ userId } = {}, callback) => {
      try {
        if (userId != null && Number(userId) !== socket.userId) {
          throw new Error('userId mismatch');
        }

        socket.join(`user:${socket.userId}`);

        const pending = await ConversationInvite.count({
          where: {
            status: 'pending',
            [Op.or]: [
              { to_user_id: socket.userId },
              { from_user_id: socket.userId },
            ],
          },
        });

        if (pending > 0) {
          socket.join(pendingRoomFor(socket.userId));
        }

        if (typeof callback === 'function') callback({ ok: true });
      } catch (error) {
        console.error('[Socket] invite:join error:', error.message);

        if (typeof callback === 'function') {
          callback({ ok: false, message: error.message });
        }
      }
    });

    // Kirim undangan: validasi sama seperti POST /api/invites, simpan invite
    // pending, lalu broadcast invite:new ke pengirim & penerima.
    socket.on('invite:send', async ({ lesson_id, to_username } = {}, callback) => {
      try {
        if (!lesson_id || !to_username) {
          throw new Error('lesson_id and to_username are required.');
        }

        const lesson = await Lesson.findByPk(lesson_id, { include: 'pathway' });
        if (!lesson) throw new Error('Lesson not found.');

        const toUser = await User.findOne({ where: { username: to_username } });
        if (!toUser) throw new Error('Username not found.');

        if (toUser.id === socket.userId) {
          throw new Error('You cannot invite yourself.');
        }

        const fromUser = await User.findByPk(socket.userId);

        const lessonStatus = await ControllerInvite.lessonStatusForUser(
          lesson,
          socket.userId,
        );
        if (lessonStatus === 'locked') {
          throw new Error('Lesson is still locked.');
        }

        const invite = await ConversationInvite.create({
          lesson_id: lesson.id,
          from_user_id: socket.userId,
          to_user_id: toUser.id,
          status: 'pending',
        });

        const payload = buildInviteNewPayload({ invite, lesson, fromUser, toUser });

        // Aktifkan room pending kedua sisi untuk broadcast badge berikutnya.
        joinPendingRoom(toUser.id);
        joinPendingRoom(socket.userId);

        sendToUser(toUser.id, 'invite:new', payload);
        sendToUser(socket.userId, 'invite:new', payload);

        if (typeof callback === 'function') callback({ ok: true, invite: payload });
      } catch (error) {
        console.error('[Socket] invite:send error:', error.message);

        if (typeof callback === 'function') {
          callback({ ok: false, message: error.message });
        }
      }
    });

    // Terima/tolak undangan: update status (+ buat conversation bila accept),
    // lalu broadcast invite:status ke kedua sisi.
    socket.on('invite:respond', async ({ inviteId, action } = {}, callback) => {
      try {
        if (!inviteId) throw new Error('inviteId is required.');

        if (action !== 'accept' && action !== 'reject') {
          throw new Error('action must be "accept" or "reject".');
        }

        const invite = await ConversationInvite.findByPk(inviteId);
        if (!invite) throw new Error('Invite not found.');

        if (invite.to_user_id !== socket.userId) {
          throw new Error('Only the invited user can respond to this invite.');
        }

        if (invite.status !== 'pending') {
          throw new Error('Invite has already been responded.');
        }

        const status = action === 'accept' ? 'accepted' : 'rejected';
        let conversationId = null;

        if (action === 'accept') {
          const conversation = await sequelize.transaction(async (t) => {
            await invite.update({ status: 'accepted' }, { transaction: t });
            return ControllerInvite.createConversationFromInvite(invite, t);
          });
          conversationId = conversation.id;
        } else {
          await invite.update({ status: 'rejected' });
        }

        const [fromUser, toUser] = await Promise.all([
          User.findByPk(invite.from_user_id),
          User.findByPk(invite.to_user_id),
        ]);

        const payload = {
          invite_id: invite.id,
          status,
          lesson_id: invite.lesson_id,
          ...(conversationId ? { conversation_id: conversationId } : {}),
          from_username: fromUser ? fromUser.username : null,
          to_username: toUser ? toUser.username : null,
        };

        // Reset room pending bila user sudah tidak punya invite pending lain.
        await leavePendingRoomIfNoPending(invite.from_user_id);
        await leavePendingRoomIfNoPending(invite.to_user_id);

        sendToUser(invite.from_user_id, 'invite:status', payload);
        sendToUser(invite.to_user_id, 'invite:status', payload);

        if (typeof callback === 'function') callback({ ok: true, ...payload });
      } catch (error) {
        console.error('[Socket] invite:respond error:', error.message);

        if (typeof callback === 'function') {
          callback({ ok: false, message: error.message });
        }
      }
    });

    // User siap -> setelah semua partisipan ready, hapus demo dari state,
    // ubah conversation.status jadi 'active', broadcast ke kedua user.
    socket.on('demo:ready', async ({ conversationId }) => {
      try {
        if (!conversationId) return emitError(socket, 'conversationId is required');

        const conversation = await getConversationForUser(conversationId, socket.userId);
        const demo = demoScripts.get(conversationId);

        if (!demo) {
          socket.emit('conversation:active', { conversationId });
          return;
        }

        demo.readyUsers.add(socket.userId);

        const participantIds = await getParticipantIds(conversationId);

        if (participantIds.every((id) => demo.readyUsers.has(id))) {
          demoScripts.delete(conversationId);
          demoDone.add(conversationId);
          await conversation.update({ status: 'active' });

          io.to(`conversation:${conversationId}`).emit('conversation:active', {
            conversationId,
          });
        }
      } catch (error) {
        console.error('[Socket] demo:ready error:', error.message);
        emitError(socket, error.message);
      }
    });

    // Chat asli antar 2 user -> simpan ke Messages, broadcast message:new ke room.
    socket.on('message:send', async ({ conversationId, content }) => {
      try {
        if (!conversationId) return emitError(socket, 'conversationId is required');
        if (!content || typeof content !== 'string' || !content.trim()) {
          return emitError(socket, 'Content is required');
        }

        const conversation = await getConversationForUser(conversationId, socket.userId);

        if (conversation.status === 'finished') {
          return emitError(socket, 'Session already finished');
        }

        if (demoScripts.has(conversationId)) {
          return emitError(socket, 'Finish the demo first');
        }

        const message = await Message.create({
          conversation_id: conversationId,
          sender_id: socket.userId,
          sender_type: 'user',
          message_type: 'chat',
          role: 'user',
          content: content.trim(),
        });

        io.to(`conversation:${conversationId}`).emit('message:new', {
          id: message.id,
          conversationId,
          sender_type: message.sender_type,
          sender_id: message.sender_id,
          message_type: message.message_type,
          content: message.content,
          created_at: message.created_at,
        });
      } catch (error) {
        console.error('[Socket] message:send error:', error.message);
        emitError(socket, error.message);
      }
    });

    // Minta saran ke AI -> simpan sebagai message_type suggestion, broadcast message:new.
    socket.on('suggestion:request', async ({ conversationId }) => {
      try {
        if (!conversationId) return emitError(socket, 'conversationId is required');

        const conversation = await getConversationForUser(conversationId, socket.userId);

        if (conversation.status === 'finished') {
          return emitError(socket, 'Session already finished');
        }

        if (demoScripts.has(conversationId)) {
          return emitError(socket, 'Finish the demo first');
        }

        const message = await Message.create({
          conversation_id: conversationId,
          sender_id: null,
          sender_type: 'ai',
          message_type: 'suggestion',
          role: 'ai',
          content: generateSuggestion(),
        });

        io.to(`conversation:${conversationId}`).emit('message:new', {
          id: message.id,
          conversationId,
          sender_type: message.sender_type,
          sender_id: message.sender_id,
          message_type: message.message_type,
          content: message.content,
          created_at: message.created_at,
        });
      } catch (error) {
        console.error('[Socket] suggestion:request error:', error.message);
        emitError(socket, error.message);
      }
    });

    // Selesai sesi -> simpan evaluasi 1 baris per partisipan, tandai lesson
    // 'completed', lalu emit 'session:evaluation' ke masing-masing user.
    socket.on('session:finish', async ({ conversationId }) => {
      try {
        if (!conversationId) return emitError(socket, 'conversationId is required');

        const conversation = await getConversationForUser(conversationId, socket.userId);

        if (conversation.status === 'finished') {
          return emitError(socket, 'Session already finished');
        }

        const participantIds = await getParticipantIds(conversationId);

        await conversation.update({ status: 'finished', ended_at: new Date() });

        for (const userId of participantIds) {
          const { strengths, evaluation, score } = generateEvaluation();

          const [sessionEvaluation] = await SessionEvaluation.findOrCreate({
            where: { conversation_id: conversationId, user_id: userId },
            defaults: { conversation_id: conversationId, user_id: userId, strengths, evaluation, score },
          });

          const [progress, created] = await UserLessonProgress.findOrCreate({
            where: { user_id: userId, lesson_id: conversation.lesson_id },
            defaults: {
              user_id: userId,
              lesson_id: conversation.lesson_id,
              status: 'completed',
              score: sessionEvaluation.score,
              completed_at: new Date(),
            },
          });

          if (!created) {
            await progress.update({
              status: 'completed',
              score: sessionEvaluation.score,
              completed_at: new Date(),
            });
          }

          // Dikirim ke MASING-MASING user, isinya evaluasi dia sendiri.
          sendToUser(userId, 'session:evaluation', {
            conversationId,
            user_id: userId,
            strengths: sessionEvaluation.strengths,
            evaluation: sessionEvaluation.evaluation,
            score: sessionEvaluation.score,
          });
        }
      } catch (error) {
        console.error('[Socket] session:finish error:', error.message);
        emitError(socket, error.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);

      const sockets = userSockets.get(socket.userId);

      if (sockets) {
        sockets.delete(socket.id);

        if (sockets.size === 0) {
          userSockets.delete(socket.userId);
        }
      }
    });
  });
};

module.exports = { initSocket };