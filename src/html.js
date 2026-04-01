function renderDocument({ title, body, authenticated = false }) {
  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root {
        --bg: #f3efe7;
        --panel: rgba(255, 255, 255, 0.86);
        --line: rgba(43, 52, 69, 0.14);
        --ink: #1f2937;
        --muted: #5b6472;
        --accent: #c05621;
        --accent-dark: #7c2d12;
        --success: #166534;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(192, 86, 33, 0.18), transparent 32%),
          linear-gradient(140deg, #f8f4ec 0%, #efe4d1 48%, #e0d6c5 100%);
      }
      main {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
      }
      .card {
        width: min(100%, 720px);
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 28px;
        padding: 32px;
        box-shadow: 0 20px 70px rgba(31, 41, 55, 0.10);
        backdrop-filter: blur(12px);
      }
      .eyebrow {
        font: 600 0.8rem/1.2 "Avenir Next", "Segoe UI", sans-serif;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--accent-dark);
      }
      h1 {
        margin: 12px 0 8px;
        font-size: clamp(2.4rem, 4vw, 3.8rem);
        line-height: 0.95;
      }
      p {
        margin: 0;
        color: var(--muted);
        font-size: 1.02rem;
        line-height: 1.6;
      }
      form {
        display: grid;
        gap: 14px;
        margin-top: 28px;
      }
      input {
        width: 100%;
        border: 1px solid rgba(31, 41, 55, 0.12);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.95);
        padding: 16px 18px;
        font: inherit;
      }
      button, .button-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: 0;
        border-radius: 999px;
        padding: 14px 20px;
        background: linear-gradient(135deg, var(--accent) 0%, #ea580c 100%);
        color: white;
        text-decoration: none;
        font: 600 0.95rem/1 "Avenir Next", "Segoe UI", sans-serif;
        cursor: pointer;
      }
      .panel-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        margin-top: 28px;
      }
      .tile {
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 18px;
        background: rgba(255, 255, 255, 0.72);
      }
      .tile strong {
        display: block;
        margin-bottom: 8px;
      }
      .row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 24px;
      }
      .status {
        margin-top: 16px;
        color: ${authenticated ? "var(--success)" : "var(--accent-dark)"};
        font: 600 0.92rem/1.4 "Avenir Next", "Segoe UI", sans-serif;
      }
    </style>
  </head>
  <body>
    <main>${body}</main>
  </body>
</html>`;
}

function renderLoginPage({ errorMessage = "", authenticated = false }) {
  const message = authenticated
    ? "인증된 세션이 감지되었습니다. 보호 페이지로 이동할 수 있습니다."
    : "루트 비밀번호를 입력하면 모든 보호 경로에 접근할 수 있는 세션 쿠키가 발급됩니다.";

  return renderDocument({
    title: "IdeaBank Access Gate",
    authenticated,
    body: `
      <section class="card">
        <div class="eyebrow">IdeaBank Service Gate</div>
        <h1>보호 라우팅<br />접속 게이트</h1>
        <p>${message}</p>
        ${
          authenticated
            ? `<div class="row">
                <a class="button-link" href="/app">보호 페이지로 이동</a>
                <form action="/logout" method="post"><button type="submit">세션 종료</button></form>
              </div>`
            : `<form action="/login" method="post">
                <label for="password">접근 비밀번호</label>
                <input id="password" name="password" type="password" required autofocus />
                <button type="submit">세션 시작</button>
              </form>`
        }
        ${errorMessage ? `<div class="status">${errorMessage}</div>` : ""}
      </section>
    `,
  });
}

function renderProtectedPage() {
  return renderDocument({
    title: "IdeaBank Protected Area",
    authenticated: true,
    body: `
      <section class="card">
        <div class="eyebrow">Authenticated</div>
        <h1>보호 영역</h1>
        <p>쿠키 기반 세션이 유효하므로 보호 경로를 자유롭게 이동할 수 있습니다.</p>
        <div class="panel-grid">
          <article class="tile">
            <strong>미들웨어 제어</strong>
            인증이 없는 요청은 모두 루트 비밀번호 페이지로 리다이렉트됩니다.
          </article>
          <article class="tile">
            <strong>세션 유지</strong>
            성공한 인증은 HttpOnly 쿠키로 저장되어 새 페이지에서도 유지됩니다.
          </article>
          <article class="tile">
            <strong>보호 경로 예시</strong>
            <a href="/ideas">/ideas</a> 같은 추가 경로도 동일 규칙을 따릅니다.
          </article>
        </div>
        <div class="row">
          <a class="button-link" href="/ideas">아이디어 목록 보기</a>
          <form action="/logout" method="post"><button type="submit">로그아웃</button></form>
        </div>
      </section>
    `,
  });
}

function renderIdeasPage() {
  return renderDocument({
    title: "IdeaBank Ideas",
    authenticated: true,
    body: `
      <section class="card">
        <div class="eyebrow">Protected Route</div>
        <h1>Idea List</h1>
        <p>이 페이지는 루트 경로가 아닌 보호 라우트이며, 미인증 요청은 접근할 수 없습니다.</p>
        <div class="panel-grid">
          <article class="tile"><strong>Session Middleware</strong> 공통 인증 검사로 요청이 진입 전에 차단됩니다.</article>
          <article class="tile"><strong>Cookie Auth</strong> 세션 쿠키가 유효할 때만 컨텐츠가 렌더링됩니다.</article>
        </div>
        <div class="row">
          <a class="button-link" href="/app">대시보드로 돌아가기</a>
        </div>
      </section>
    `,
  });
}

module.exports = {
  renderIdeasPage,
  renderLoginPage,
  renderProtectedPage,
};
