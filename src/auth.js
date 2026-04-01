const crypto = require("node:crypto");

const COOKIE_NAME = "ideabank_session";
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

function getAccessPassword() {
  return process.env.ACCESS_PASSWORD || "ideabank2026";
}

function getSessionSecret() {
  return process.env.SESSION_SECRET || `${getAccessPassword()}-session-secret`;
}

function timingSafeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function validatePassword(password) {
  return timingSafeEqual(String(password || ""), getAccessPassword());
}

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce((cookies, segment) => {
      const separatorIndex = segment.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = segment.slice(0, separatorIndex).trim();
      const value = segment.slice(separatorIndex + 1).trim();
      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});
}

function createSessionToken() {
  const payload = `authenticated:${Date.now()}`;
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");

  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

function verifySessionToken(token) {
  if (!token) {
    return false;
  }

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastSeparator = decoded.lastIndexOf(".");

    if (lastSeparator === -1) {
      return false;
    }

    const payload = decoded.slice(0, lastSeparator);
    const signature = decoded.slice(lastSeparator + 1);
    const expected = crypto
      .createHmac("sha256", getSessionSecret())
      .update(payload)
      .digest("hex");

    return payload.startsWith("authenticated:") && timingSafeEqual(signature, expected);
  } catch {
    return false;
  }
}

function isAuthenticated(request) {
  const cookies = parseCookies(request.headers.cookie);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

function getSessionCookie(token) {
  return [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${ONE_WEEK_SECONDS}`,
    "HttpOnly",
    "SameSite=Lax",
  ].join("; ");
}

function getExpiredSessionCookie() {
  return [
    `${COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
  ].join("; ");
}

module.exports = {
  COOKIE_NAME,
  createSessionToken,
  getExpiredSessionCookie,
  getSessionCookie,
  isAuthenticated,
  parseCookies,
  validatePassword,
  verifySessionToken,
};
