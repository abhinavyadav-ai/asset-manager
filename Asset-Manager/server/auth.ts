import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";

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
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "r3pl1t_s3cr3t_k3y",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

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

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.status(200).json({ message: "Logged in successfully" });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("Not logged in");
  });

  // Seed Admin User
  (async () => {
    const configuredUsername = process.env.ADMIN_EMAIL || "admin";
    const configuredPassword = process.env.ADMIN_PASSWORD || "Admin@2026!";

    const adminByConfiguredUsername = await storage.getUserByUsername(configuredUsername);
    if (adminByConfiguredUsername) {
      const isPasswordCurrent = await comparePasswords(configuredPassword, adminByConfiguredUsername.password);
      if (!isPasswordCurrent) {
        const hashedPassword = await hashPassword(configuredPassword);
        await storage.updateUser(adminByConfiguredUsername.id, {
          username: configuredUsername,
          password: hashedPassword,
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
      });
      console.log("Legacy admin user migrated to configured credentials");
      return;
    }

    const hashedPassword = await hashPassword(configuredPassword);
    await storage.createUser({
      username: configuredUsername,
      password: hashedPassword,
    });
    console.log("Admin user created with configured credentials");
  })();
}
