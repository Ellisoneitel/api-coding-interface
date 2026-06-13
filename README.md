# Codex Local Assistant

A local coding assistant app with a Node/Express API server and a Vite React client.

## What You Need

Install these before running the app:

- Node.js 18 or newer from https://nodejs.org
- npm, which is included with Node.js
- An OpenAI API key, added inside the app after it opens

You do not need to install anything separately inside `client` or `server`. Run every command below from the main project folder, the one that contains this README.

## First-Time Setup

Pick the command for your computer.

### macOS, Linux, WSL, or Git Bash

```bash
bash setup.sh
```

### Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

### Windows Command Prompt

```bat
setup.bat
```

The setup script checks for Node.js, installs all project dependencies from `package-lock.json`, and then tells you when the app is ready to run.

## Run The App

After setup finishes, start the local development servers:

```bash
npm run dev
```

If someone skips setup and runs `npm run dev` first, the app will install missing dependencies automatically before starting.

Then open:

```text
http://localhost:5173
```

The web app runs on `http://localhost:5173`, and the API server runs on `http://localhost:8787`.

## Easier Start Commands

These commands install dependencies if they are missing, then start the app.

### macOS, Linux, WSL, or Git Bash

```bash
bash start.sh
```

### Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

### Windows Command Prompt

```bat
start.bat
```

## Clean Reinstall

Use this when dependencies seem broken or you want to reset the local install.

### macOS, Linux, WSL, or Git Bash

```bash
bash start.sh --clean
```

### Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1 -Clean
```

### Windows Command Prompt

```bat
start.bat -Clean
```

## Using The App

1. Open `http://localhost:5173`.
2. Add your OpenAI API key in Settings.
3. Select the local workspace folder you want the assistant to work in.
4. Start a chat.

## Troubleshooting

- If setup says Node.js is missing or too old, install the current LTS version from https://nodejs.org and run setup again.
- If `npm run dev` says a port is already in use, close the old terminal running the app and try again.
- If dependencies fail after an update, run the clean reinstall command for your computer.
