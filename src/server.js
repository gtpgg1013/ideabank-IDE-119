const http = require("node:http");
const { URLSearchParams } = require("node:url");

const {
  createSessionToken,
  getExpiredSessionCookie,
  getSessionCookie,
  isAuthenticated,
  validatePassword,
} = require("./auth");
const {
  renderIdeasPage,
  renderLoginPage,
  renderProtectedPage,
} = require("./html");

function sendHtml(response, statusCode, html, headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    ...headers,
  });
  response.end(html);
}

function redirect(response, location, headers = {}) {
  response.writeHead(302, {
    Location: location,
    ...headers,
  });
  response.end();
}

function notFound(response) {
  sendHtml(
    response,
    404,
    renderLoginPage({
      errorMessage: "요청한 페이지를 찾을 수 없습니다.",
      authenticated: false,
    }),
  );
}

function parseRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });

    request.on("end", () => {
      resolve(new URLSearchParams(body));
    });

    request.on("error", reject);
  });
}

function getRouteAccess(pathname) {
  if (pathname === "/" || pathname === "/login" || pathname === "/logout" || pathname === "/health") {
    return "public";
  }

  return "protected";
}

function authenticationMiddleware(request, response) {
  const url = new URL(request.url, "http://localhost");
  const access = getRouteAccess(url.pathname);

  if (access === "protected" && !isAuthenticated(request)) {
    redirect(response, "/");
    return false;
  }

  return true;
}

async function requestListener(request, response) {
  if (!authenticationMiddleware(request, response)) {
    return;
  }

  const url = new URL(request.url, "http://localhost");
  const authenticated = isAuthenticated(request);

  if (request.method === "GET" && url.pathname === "/") {
    sendHtml(response, 200, renderLoginPage({ authenticated }));
    return;
  }

  if (request.method === "POST" && url.pathname === "/login") {
    const formData = await parseRequestBody(request);
    const password = formData.get("password");

    if (!validatePassword(password)) {
      sendHtml(
        response,
        401,
        renderLoginPage({
          errorMessage: "비밀번호가 올바르지 않습니다.",
          authenticated: false,
        }),
      );
      return;
    }

    redirect(response, "/app", {
      "Set-Cookie": getSessionCookie(createSessionToken()),
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/logout") {
    redirect(response, "/", {
      "Set-Cookie": getExpiredSessionCookie(),
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/app") {
    sendHtml(response, 200, renderProtectedPage());
    return;
  }

  if (request.method === "GET" && url.pathname === "/ideas") {
    sendHtml(response, 200, renderIdeasPage());
    return;
  }

  if (request.method === "GET" && url.pathname === "/health") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  notFound(response);
}

function createServer() {
  return http.createServer((request, response) => {
    Promise.resolve(requestListener(request, response)).catch((error) => {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(`Internal Server Error\n${error.message}`);
    });
  });
}

function startServer(port = Number(process.env.PORT || 3201)) {
  const server = createServer();

  server.listen(port, () => {
    process.stdout.write(`IdeaBank service listening on http://localhost:${port}\n`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  authenticationMiddleware,
  createServer,
  getRouteAccess,
  requestListener,
  startServer,
};
