import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";

declare module "express-session" {
  interface SessionData {
    csrfToken?: string;
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedPasswordBuf = Buffer.from(hashed, "hex");
  const suppliedPasswordBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET;
  const configuredUsername = process.env.ADMIN_EMAIL;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET must be set");
  }
  if (process.env.NODE_ENV === "production" && (!configuredUsername || !configuredPassword)) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in production");
  }

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret as string,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  app.get("/api/csrf-token", (req, res) => {
    const token = req.session.csrfToken || randomBytes(32).toString("hex");
    req.session.csrfToken = token;
    res.json({ token });
  });

  app.use(((req, res, next) => {
    const stateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
    if (!stateChanging || !req.isAuthenticated() || req.path === "/api/login") {
      return next();
    }
    const supplied = req.get("x-csrf-token");
    const expected = req.session.csrfToken;
    if (!supplied || !expected || supplied.length !== expected.length ||
        !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
      return res.status(403).json({ message: "CSRF validation failed" });
    }
    next();
  }) as RequestHandler);

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, (user as User).id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/login", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }), (req, res, next) => {
    passport.authenticate("local", (err: unknown, user: User | false | null, _info: unknown) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.regenerate((regenerateError) => {
        if (regenerateError) return next(regenerateError);
        req.login(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.status(200).json({ message: "Logged in successfully" });
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((destroyError) => {
        if (destroyError) return next(destroyError);
        res.clearCookie("connect.sid");
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as User;
      return res.json({ id: user.id, username: user.username, role: user.role });
    }
    res.status(401).send("Not logged in");
  });

  // Seed Admin User
  (async () => {
    if (!configuredUsername || !configuredPassword) return;

    const adminByConfiguredUsername = await storage.getUserByUsername(configuredUsername);
    if (adminByConfiguredUsername) {
      const isPasswordCurrent = await comparePasswords(configuredPassword, adminByConfiguredUsername.password);
      if (!isPasswordCurrent) {
        const hashedPassword = await hashPassword(configuredPassword);
        await storage.updateUser(adminByConfiguredUsername.id, {
          username: configuredUsername,
          password: hashedPassword,
          role: "admin",
        });
        console.log("Admin password updated to configured value");
      }
      return;
    }

    const legacyAdmin = await storage.getUserByUsername("admin");
    if (legacyAdmin) {
      const hashedPassword = await hashPassword(configuredPassword);
      await storage.updateUser(legacyAdmin.id, {
        username: configuredUsername,
        password: hashedPassword,
        role: "admin",
      });
      console.log("Legacy admin user migrated to configured credentials");
      return;
    }

    const hashedPassword = await hashPassword(configuredPassword);
    await storage.createUser({
      username: configuredUsername,
      password: hashedPassword,
      role: "admin",
    });
    console.log("Admin user created with configured credentials");
  })();
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated() || (req.user as User).role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
