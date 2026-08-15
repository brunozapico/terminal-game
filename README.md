# Terminal Quest

A gamified educational web app for building real fluency with the macOS and Linux terminal. It includes a safe simulated terminal, virtual filesystem, progressive challenges, free practice, hints, XP, streaks, local persistence, and a command library.

## Run locally

Open `index.html` directly in a modern browser. It requires no npm, server, build process, or external dependencies.

It can also be published as a static site on Vercel:

1. Import this repository.
2. Choose any static preset or leave the framework empty.
3. Use `./` as the root directory with no build command.

## Test

Install the development dependency and run the browser-like regression suite:

```bash
npm ci
npm test
```

The suite checks the social metadata and header structure, verifies the personalized onboarding flow, and completes all 66 challenges through the rendered terminal UI. GitHub Actions runs it on every push and pull request.

## Add commands

In the `<script>` of `index.html`, register a command with `registerCommand("name", { ... })`. Each definition can include:

- `category`, `description`, `platforms`;
- `examples`, `options`, `help`;
- `execute(args, ctx)`, which returns `result(stdout, stderr)`.

The command becomes available in the terminal and through `man`, `which`, and the Command library.

## Add challenges

Add an object with `makeChallenge({ ... })` inside `challengeList`. The minimum structure is:

```js
makeChallenge({
  id: "files-new-mission",
  level: 3,
  levelName: "Build Something",
  title: "...",
  explanation: "...",
  example: "...",
  objective: "...",
  setup: () => makeBaseScenario(),
  validator: (check) => checkResult(
    check.fs.exists("file.txt", check.cwd),
    "The current state does not meet the objective yet."
  ),
  hints: ["...", "...", "..."],
  solution: "touch file.txt"
})
```

Validators should check the final state of the virtual filesystem or environment rather than comparing the exact command text.
