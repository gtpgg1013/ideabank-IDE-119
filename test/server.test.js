const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");

const { requestListener } = require("../src/server");

function createMockRequest({ method, url, headers = {}, body = "" }) {
  const request = new EventEmitter();
  request.method = method;
  request.url = url;
  request.headers = headers;

  process.nextTick(() => {
    if (body) {
      request.emit("data", body);
    }

    request.emit("end");
  });

  return request;
}

function createMockResponse() {
  return {
    statusCode: null,
    headers: null,
    body: "",
    ended: false,
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(chunk = "") {
      this.body += chunk;
      this.ended = true;
    },
  };
}

async function performRequest(options) {
  const request = createMockRequest(options);
  const response = createMockResponse();

  await requestListener(request, response);

  return response;
}

test("unauthenticated users are redirected from protected routes to root", async () => {
  process.env.ACCESS_PASSWORD = "ideabank2026";

  const response = await performRequest({
    method: "GET",
    url: "/ideas",
  });

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.Location, "/");
});

test("successful login sets a session cookie and grants access to protected route", async () => {
  process.env.ACCESS_PASSWORD = "top-secret";

  const loginResponse = await performRequest({
    method: "POST",
    url: "/login",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "password=top-secret",
  });

  assert.equal(loginResponse.statusCode, 302);
  assert.equal(loginResponse.headers.Location, "/app");

  const cookie = loginResponse.headers["Set-Cookie"];
  assert.ok(cookie);

  const protectedResponse = await performRequest({
    method: "GET",
    url: "/app",
    headers: {
      cookie,
    },
  });

  assert.equal(protectedResponse.statusCode, 200);
  assert.match(protectedResponse.body, /보호 영역/);
});

test("invalid password keeps the user on the password page", async () => {
  process.env.ACCESS_PASSWORD = "correct-password";

  const response = await performRequest({
    method: "POST",
    url: "/login",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "password=wrong-password",
  });

  assert.equal(response.statusCode, 401);
  assert.match(response.body, /비밀번호가 올바르지 않습니다/);
});
