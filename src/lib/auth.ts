import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface User {
  username: string;
  name: string;
}

// Dynamically load all predefined users from environment variables
function loadUsers() {
  const users = [];
  
  // Load users from AUTH_USER_1, AUTH_USER_2, etc.
  for (let i = 1; i <= 10; i++) {
    const username = process.env[`AUTH_USER_${i}`];
    const password = process.env[`AUTH_PASS_${i}`];
    
    if (username && password) {
      users.push({
        username,
        password,
        name: username.charAt(0).toUpperCase() + username.slice(1),
      });
    }
  }
  
  // Default admin user if no users configured
  if (users.length === 0) {
    users.push({
      username: "admin",
      password: "$2a$10$X8xhXKt7VwLmYKPQfW0qy.QqhY8U8Y9KPv8h2yxC.yX/Z8.mNGxZO", // "admin"
      name: "Administrator",
    });
  }
  
  return users;
}

const USERS = loadUsers();

/**
 * Verify user credentials
 */
export async function verifyCredentials(
  username: string,
  password: string
): Promise<User | null> {
  const user = USERS.find((u) => u.username === username);
  
  if (!user) {
    return null;
  }

  // Check if password is hashed or plain
  const isValid = user.password.startsWith("$2")
    ? await bcrypt.compare(password, user.password)
    : password === user.password;

  if (!isValid) {
    return null;
  }

  return {
    username: user.username,
    name: user.name,
  };
}

/**
 * Create a session token
 */
export async function createSession(user: User): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + SESSION_DURATION))
    .sign(secret);

  return token;
}

/**
 * Verify and decode session token
 */
export async function verifySession(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.user as User;
  } catch (error) {
    return null;
  }
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
