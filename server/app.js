require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const MongoDBStore = require("connect-mongodb-session")(session);
const cookieParser = require("cookie-parser");

// Routers
const loginRouter = require("./views/login");
const signupRouter = require("./views/signup");
const userRouter = require("./views/rbac/handleUser");
const googleRouter = require("./views/google");
const githubRouter = require("./views/github");
const logoutRouter = require("./views/logout");
const roleRouter = require("./views/rbac/handleRole");
const permissionRouter = require("./views/rbac/handlePermission");
const logRouter = require("./views/rbac/handleLog");

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:4444",
      "exp://192.168.239.205:19000",
      "http://localhost:7501",
    ],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT"],
  })
);

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// const store = new MongoDBStore({
//   uri: process.env.MONGO_URI,
//   collection: "sessions",
// });

store.on("error", function (error) {
  console.log("There is err storing session: ", error);
});

app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "none",
      secure: true,
      maxAge: 1000 * 60 * 60 * 24 * 180,
    },
    store: store,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const User = require("./schema/user");
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).exec();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Routes
app.use("/api/login", loginRouter);
app.use("/api/signup", signupRouter);
app.use("/api/user", userRouter);
app.use("/api/auth/google", googleRouter);
app.use("/api/auth/github", githubRouter);
app.use("/api/logout", logoutRouter);
app.use("/api/role", roleRouter);
app.use("/api/permission", permissionRouter);
app.use("/api/log", logRouter);

app.get("/", (req, res) => {
  res.send("server is up and running!");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
});

// Connect to MongoDB and start the server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
