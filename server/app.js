require("dotenv").config();
const express = require("express");
const Controller = require("./controllers/controllerUser");
const errorHandler = require("./middlewares/errorHandler");
const authentication = require("./middlewares/authentication");
const authorization = require("./middlewares/authorization");
const app = express();
const cors = require("cors");
const ControllerPathways = require("./controllers/controllerPathway");
const ControllerInvite = require("./controllers/controllerInvite");
const ControllerConversation = require("./controllers/controllerConversation");

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(express.json());
app.use(cors());

app.post("/api/auth/register", Controller.register);
app.post("/api/auth/login", Controller.login);

app.use(authentication);

app.get("/api/pathways", ControllerPathways.read);
app.get("/api/pathways/progress", ControllerPathways.getProgress);
app.get("/api/pathways/:id/lessons", ControllerPathways.readStatus);

app.post("/api/invites", ControllerInvite.create);
app.get("/api/invites", ControllerInvite.getAll);
app.patch("/api/invites/:id/accept", ControllerInvite.accept);
app.patch("/api/invites/:id/reject", ControllerInvite.reject);

app.get("/api/conversations/:id", ControllerConversation.read);
app.get(
  "/api/conversations/:id/messages",
  ControllerConversation.readMessages,
);

app.use(errorHandler);

module.exports = app;
