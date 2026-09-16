import test from "node:test";
import assert from "node:assert/strict";
import { bindChatEvents, chatReducer, initialChatState } from "../src/utils/chatState.js";

function setup() {
  const listeners = new Map();
  const emitted = [];
  const socket = {
    on(event, handler) { listeners.set(event, handler); },
    off(event, handler) {
      if (listeners.get(event) === handler) listeners.delete(event);
    },
    emit(event, payload) { emitted.push({ event, payload }); },
  };
  let state = chatReducer(initialChatState, {
    type: "loaded", conversation: { id: 7, status: "demo" }, messages: [],
  });
  const dispatch = (action) => { state = chatReducer(state, action); };
  const cleanup = bindChatEvents(socket, "7", 1, dispatch);
  return {
    dispatch, cleanup, emitted, listeners,
    receive(event, data) { listeners.get(event)?.(data); },
    get state() { return state; },
  };
}

const message = {
  id: 10, conversation_id: 7, sender_type: "user", sender_id: 1,
  message_type: "chat", content: "Hello!", created_at: "2026-09-16T10:00:00Z",
};

test("join → demo → active → message → personal evaluation", () => {
  const room = setup();
  room.receive("connect");
  assert.equal(room.state.connected, true);
  assert.deepEqual(room.emitted, [{ event: "conversation:join", payload: { conversationId: 7 } }]);
  const lines = [{ speaker: "A", text: "Hello!" }];
  room.receive("demo:script", { lines });
  assert.deepEqual(room.state.lines, lines);
  room.dispatch({ type: "pending", value: "ready" });
  room.receive("conversation:active", { conversationId: 7 });
  assert.equal(room.state.conversation.status, "active");
  assert.deepEqual(room.state.lines, []);
  assert.equal(room.state.pending, null);
  room.dispatch({ type: "pending", value: "send" });
  room.receive("message:new", message);
  assert.equal(room.state.messages.length, 1);
  assert.equal(room.state.pending, null);
  room.dispatch({ type: "pending", value: "finish" });
  const evaluation = { conversationId: 7, user_id: 1, score: 4, strengths: "Clear", evaluation: "Practice tenses" };
  room.receive("session:evaluation", evaluation);
  assert.deepEqual(room.state.evaluation, evaluation);
  assert.equal(room.state.conversation.status, "completed");
  assert.equal(room.state.pending, null);
  room.cleanup();
});

test("ignore other rooms and evaluations belonging to another user", () => {
  const room = setup();
  room.receive("message:new", { ...message, conversation_id: 8 });
  room.receive("conversation:active", { conversationId: 8 });
  room.receive("session:evaluation", { conversationId: 7, user_id: 2 });
  room.receive("session:evaluation", { conversationId: 8, user_id: 1 });
  assert.equal(room.state.messages.length, 0);
  assert.equal(room.state.conversation.status, "demo");
  assert.equal(room.state.evaluation, null);
  room.cleanup();
});

test("deduplicate message events and resolve only the matching pending action", () => {
  const room = setup();
  room.dispatch({ type: "pending", value: "send" });
  room.receive("message:new", { ...message, id: 11, sender_id: 2 });
  assert.equal(room.state.pending, "send");
  room.receive("message:new", message);
  room.receive("message:new", { ...message, id: "10" });
  assert.equal(room.state.messages.length, 2);
  assert.equal(room.state.pending, null);
  room.dispatch({ type: "pending", value: "suggestion" });
  room.receive("message:new", { ...message, id: 12, sender_type: "ai", sender_id: null, message_type: "suggestion" });
  assert.equal(room.state.pending, null);
  room.cleanup();
});

test("connection failure clears pending action and reconnect rejoins room", () => {
  const room = setup();
  room.receive("connect");
  room.dispatch({ type: "pending", value: "send" });
  room.receive("disconnect");
  assert.equal(room.state.connected, false);
  assert.equal(room.state.pending, null);
  assert.ok(room.state.error);
  room.receive("connect_error");
  assert.equal(room.state.connected, false);
  room.receive("connect");
  assert.equal(room.emitted.length, 2);
  assert.equal(room.state.error, "");
  room.cleanup();
});

test("cleanup removes all listeners and prevents stale evaluation updates", () => {
  const room = setup();
  assert.ok(room.listeners.size > 0);
  room.cleanup();
  assert.equal(room.listeners.size, 0);
  room.receive("session:evaluation", { conversationId: 7, user_id: 1 });
  assert.equal(room.state.evaluation, null);
});

test("reset clears private session data; late demo cannot replace an active session", () => {
  const room = setup();
  room.receive("conversation:active", { conversationId: 7 });
  room.receive("demo:script", { lines: ["stale demo"] });
  assert.deepEqual(room.state.lines, []);
  room.receive("message:new", message);
  room.receive("session:evaluation", { conversationId: 7, user_id: 1 });
  room.dispatch({ type: "reset" });
  assert.deepEqual(room.state, initialChatState);
  room.cleanup();
});
