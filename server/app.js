require("dotenv").config();
const express = require("express");
const Controller = require("./controllers/controllerUser");
const errorHandler = require("./middlewares/errorHandler");
const authentication = require("./middlewares/authentication");
const authorization = require("./middlewares/authorization");
const app = express();
const cors = require("cors");

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

app.use(errorHandler);

module.exports = app;
