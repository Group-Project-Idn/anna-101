const http = require("http");
const app = require("../app");
const { initSocket } = require("../socket/socketHandler");
const port = 3000;

const server = http.createServer(app);

// Socket.io harus di-init di HTTP server yang sama.
// Tanpa ini, endpoint /socket.io/ 404 dan chat realtime tidak jalan.
initSocket(server);

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
