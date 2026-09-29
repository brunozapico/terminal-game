const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { Window } = require("happy-dom");

const repoRoot = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const body = html.match(/<body>([\s\S]*)<script>/)?.[1];
const solutions = [...html.matchAll(/solution: "((?:\\.|[^"])*)"/g)].map((match) => JSON.parse(`"${match[1]}"`));

function bootApp() {
  assert.ok(script && body, "index.html should contain an inline script and body");
  const window = new Window({ url: "https://terminal-quest.test/" });
  window.confirm = () => true;
  window.document.body.innerHTML = body;
  window.eval(script);
  return window;
}

async function settle(window) {
  await window.happyDOM.whenAsyncComplete();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function click(window, id) {
  window.document.getElementById(id).click();
}

function typeCommand(window, input, command) {
  input.value = command;
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
}

test("social metadata and header structure are present", () => {
  assert.match(html, /<meta property="og:title" content="Terminal Quest/);
  assert.match(html, /<meta property="og:image" content="https:\/\/terminal-quest\.vercel\.app\/og-image\.png">/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/terminal-quest\.vercel\.app\/og-image\.png">/);
  assert.match(html, /<span class="brand-copy"><span class="brand-title">Terminal Quest<\/span><span class="brand-subtitle">learn by using the terminal<\/span><\/span>/);
  assert.match(html, /\.brand-copy \{[^}]*display: flex;[^}]*flex-direction: column;[^}]*gap: 2px;/s);
  assert.ok(fs.existsSync(path.join(repoRoot, "og-image.svg")), "editable social card source should exist");
  assert.ok(fs.existsSync(path.join(repoRoot, "og-image.png")), "raster social card image should exist");
  assert.match(html, /window\.va = window\.va \|\| function \(\) \{ \(window\.vaq = window\.vaq \|\| \[\]\)\.push\(arguments\); \};/);
  assert.match(html, /<script defer src="\/_vercel\/insights\/script\.js"><\/script>/);
  assert.match(html, /connect-src 'self'/);
  assert.match(html, /script-src 'self' 'unsafe-inline'/);
});

test("onboarding requires and personalizes the terminal user", async () => {
  const window = bootApp();
  await settle(window);
  const modal = window.document.getElementById("onboardingModal");
  const name = window.document.getElementById("playerName");
  assert.equal(modal.classList.contains("hidden"), false);
  assert.equal(window.document.activeElement, name);

  click(window, "startButton");
  assert.equal(window.document.getElementById("nameError").textContent, "Enter a name using letters or numbers.");

  name.value = "Ada Lovelace";
  click(window, "startButton");
  await settle(window);
  assert.equal(modal.classList.contains("hidden"), true);
  assert.match(window.document.getElementById("lessonPrompt").textContent, /^ada-lovelace@/);

  const input = window.document.getElementById("lessonInput");
  typeCommand(window, input, "pwd");
  assert.equal([...window.document.querySelectorAll("#lessonOutput .terminal-stdout")].at(-1)?.textContent, "/home/ada-lovelace");
  typeCommand(window, input, "whoami");
  assert.match(window.document.getElementById("lessonOutput").textContent, /ada-lovelace/);
});

test("challenge map revisits completed challenges and the current challenge", async () => {
  const window = bootApp();
  await settle(window);
  const name = window.document.getElementById("playerName");
  name.value = "Ada Lovelace";
  click(window, "startButton");
  await settle(window);

  const input = window.document.getElementById("lessonInput");
  const challengeButtons = () => [...window.document.querySelectorAll("#challengeNav .challenge-item")];
  assert.equal(challengeButtons().length, 66);
  assert.equal(window.document.getElementById("challengeNavStatus").textContent, "1 / 66 available");
  assert.equal(challengeButtons()[0].disabled, false);
  assert.equal(challengeButtons()[1].disabled, true);

  typeCommand(window, input, "pwd");
  click(window, "checkChallenge");
  click(window, "continueChallenge");
  typeCommand(window, input, "ls");
  click(window, "checkChallenge");
  click(window, "continueChallenge");

  assert.equal(window.document.getElementById("lessonTitle").textContent, "Know the user");
  assert.equal(window.document.getElementById("challengeNavStatus").textContent, "3 / 66 available");
  assert.equal(challengeButtons()[0].classList.contains("done"), true);
  assert.equal(challengeButtons()[1].classList.contains("done"), true);
  assert.equal(challengeButtons()[2].classList.contains("current"), true);
  assert.equal(challengeButtons()[3].disabled, true);

  challengeButtons()[0].click();
  assert.equal(window.document.getElementById("lessonTitle").textContent, "Find your bearings");
  assert.equal(window.document.getElementById("challengeProgressText").textContent, "2 / 66 challenges");
  assert.equal(window.document.querySelector('#challengeNav button[data-challenge-index="0"]').getAttribute("aria-current"), "step");

  window.document.querySelector('#challengeNav button[data-challenge-index="2"]').click();
  assert.equal(window.document.getElementById("lessonTitle").textContent, "Know the user");
});

test("all 66 challenges can be completed", async () => {
  assert.equal(solutions.length, 66, "the challenge suite must contain exactly 66 solutions");
  const window = bootApp();
  await settle(window);
  const name = window.document.getElementById("playerName");
  name.value = "Ada Lovelace";
  click(window, "startButton");
  await settle(window);
  const input = window.document.getElementById("lessonInput");

  for (const [index, solution] of solutions.entries()) {
    for (const command of solution.split("\n")) typeCommand(window, input, command);
    click(window, "checkChallenge");
    const title = window.document.getElementById("feedbackTitle").textContent;
    assert.match(title, /Challenge complete|already complete/, `challenge ${index + 1} did not complete: ${title}`);
    const continueButton = window.document.getElementById("continueChallenge");
    if (!continueButton.hidden) click(window, "continueChallenge");
  }

  assert.equal(window.document.getElementById("challengeProgressText").textContent, "66 / 66 challenges");
  const celebration = window.document.getElementById("terminalCelebration");
  assert.equal(celebration.hidden, false);
  assert.equal(celebration.classList.contains("celebration-active"), true);
  assert.match(celebration.textContent, /66 challenges cleared/);
  assert.equal(celebration.querySelectorAll(".celebration-confetti i").length, 12);
  assert.match(window.document.getElementById("lessonOutput").textContent, /QUEST COMPLETE/);
});
