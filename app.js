const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

const app = express();

const fileStorage = multer.diskStorage({
  // set the path for storing images
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  // for image name store in images folder
  filename: (req, file, cb) => {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentTime = new Date()
      .toISOString()
      .slice(11, 19)
      .replace(/:/g, "-");
    const ext = path.extname(file.originalname);
    cb(null, currentDate + "-" + currentTime + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(
    "mongodb+srv://vatsal:XcU-54K$t386tz2@cluster0.znpgm81.mongodb.net/message",
    { useNewUrlParser: true }
  )
  .then((result) => {
    //Now the listen method here does actually return us a new node server,do we can store in constant
    const server = app.listen(8080);
    //we are exporting here actually exposes a function which requires our created server as an argument.
    const io = require("./socket").init(server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "PATCH"],
      },
    });
    io.on("connection", (socket) => {
      console.log("Client connected!");
    });
  })
  .catch((err) => console.log(err));
