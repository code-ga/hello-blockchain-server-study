import express from "express";
import { createServer } from "http";
import morgan from "morgan";

const app = express();
const server = createServer(app);

app.use(express.urlencoded({ extended: true }));
app.use(
  morgan(function (tokens, req, res) {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms",
    ].join(" ");
  })
);

// setup route in here ...
app.get("/", (req, res) => {
  res.send("Hello World!");
});

const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`🚀 | Server is running on port ${port} | ✨`);
});

app.use((req, res, next) => {
  res.status(404).send("Sorry can't find that!");
});
