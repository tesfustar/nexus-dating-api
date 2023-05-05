import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoDbConnection from "./config/db.config";
import { uploadImage } from "./config/multer.config";
import path from "path";
//routes
import auth from "./routes/auth";
import user from "./routes/user";
import matchRequest from "./routes/matchRequest";
import notification from "./routes/notification";
import conversation from "./routes/conversation";
import messages from "./routes/messages";
import admin from "./routes/admin";

const app: Application = express();

//default middlewares
dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// in latest body-parser use like below.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use("./public", express.static(path.join(__dirname, "./public")));

//mongoose connection
mongoDbConnection;
// Routes

app.post("/api/upload", uploadImage.single("profile"), (req, res) => {
  const file = req.file;
  res.status(200).json(file);
});

app.get("/", (req: Request, res: Response) => {
  res.send("NEXUS DATING APP API Deployment!");
});

//routes
app.use("/api/auth", auth);
app.use("/api/user", user);
app.use("/api/match-request", matchRequest);
app.use("/api/notification", notification);
app.use("/api/conversation", conversation);
app.use("/api/messages", messages);
app.use("/api/admin", admin);

// Start the server
const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
