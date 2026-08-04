import { OAuth2Client } from "google-auth-library";
import express from "express";
import User from "./models/User";
import { isInfoSupplied } from "./middleware";
import { BAD_REQUEST, OK, UNAUTHORIZED } from "./util";

const router = express.Router();

// Read lazily (per-request) rather than at import time: this module is
// imported before api/index.ts calls dotenv.config(), so process.env.GOOGLE_CLIENT_ID
// would otherwise always look undefined here.
let client: OAuth2Client | undefined;
const getClient = () => {
  if (!client) {
    client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return client;
};

router.post(
  "/google",
  isInfoSupplied("body", "credential"),
  async (req, res) => {
    const { credential } = req.body;
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    let payload;
    try {
      const ticket = await getClient().verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error("Google token verification failed:", err);
      return res.status(BAD_REQUEST).json({ error: "Invalid Google credential" });
    }

    if (!payload?.sub || !payload.email) {
      return res.status(BAD_REQUEST).json({ error: "Invalid Google credential" });
    }

    const user = await User.findOneAndUpdate(
      { googleId: payload.sub },
      {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name ?? payload.email,
        avatarUrl: payload.picture,
      },
      { upsert: true, new: true }
    );

    req.session.userId = user._id.toString();
    return res.status(OK).json({
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  }
);

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    return res.status(OK).json({ data: { message: "Logged out" } });
  });
});

router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(UNAUTHORIZED).json({ error: "Not logged in" });
  }
  const user = await User.findById(req.session.userId);
  if (!user) {
    return res.status(UNAUTHORIZED).json({ error: "Not logged in" });
  }
  return res.status(OK).json({
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
  });
});

export default router;
