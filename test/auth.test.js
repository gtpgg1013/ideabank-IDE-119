const test = require("node:test");
const assert = require("node:assert/strict");

const {
  COOKIE_NAME,
  createSessionToken,
  parseCookies,
  validatePassword,
  verifySessionToken,
} = require("../src/auth");

test("validatePassword matches configured password", () => {
  process.env.ACCESS_PASSWORD = "secret-pass";

  assert.equal(validatePassword("secret-pass"), true);
  assert.equal(validatePassword("wrong-pass"), false);
});

test("parseCookies extracts multiple cookie values", () => {
  const cookies = parseCookies(`${COOKIE_NAME}=abc123; theme=light`);

  assert.deepEqual(cookies, {
    [COOKIE_NAME]: "abc123",
    theme: "light",
  });
});

test("session tokens can be created and verified", () => {
  process.env.ACCESS_PASSWORD = "another-secret";
  const token = createSessionToken();

  assert.equal(typeof token, "string");
  assert.equal(verifySessionToken(token), true);
  assert.equal(verifySessionToken(`${token}-broken`), false);
});
