# Terminal Quest

Aplicación web educativa gamificada para recuperar y desarrollar fluidez real con la terminal de macOS y Linux. Incluye una terminal simulada segura, filesystem virtual, desafíos progresivos, práctica libre, pistas, XP, streak, persistencia local y biblioteca de comandos.

## Ejecutar

Abrí `index.html` directamente en un navegador moderno. No requiere npm, servidor, build process ni dependencias externas.

También puede publicarse como sitio estático en Vercel:

1. Importá este repositorio.
2. Elegí cualquier preset estático o dejá el framework vacío.
3. Usá `./` como directorio raíz y sin comando de build.

## Agregar comandos

En el `<script>` de `index.html`, registrá un comando con `registerCommand("nombre", { ... })`. Cada definición puede incluir:

- `category`, `description`, `platforms`;
- `examples`, `options`, `help`;
- `execute(args, ctx)`, que devuelve `result(stdout, stderr)`.

El comando queda disponible para la terminal y para `man`, `which` y Command library.

## Agregar desafíos

Sumá un objeto mediante `makeChallenge({ ... })` dentro de `challengeList`. La estructura mínima es:

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
    check.fs.exists("archivo.txt", check.cwd),
    "El estado todavía no cumple el objetivo."
  ),
  hints: ["...", "...", "..."],
  solution: "touch archivo.txt"
})
```

Los validadores deben comprobar el estado final del filesystem o del entorno virtual, no comparar literalmente el comando escrito.
