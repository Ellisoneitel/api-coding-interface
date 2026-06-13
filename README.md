# Codex Local Assistant

A local coding assistant web app with a Node/Express API server and a Vite React client.

The app runs entirely on your machine:

- Web app: `http://localhost:5173`
- API server: `http://localhost:8787`

## Requirements

Install these first:

- Node.js 18 or newer from https://nodejs.org
- npm, included with Node.js
- Python 3, used by the launcher script
- An OpenAI API key, added inside the app after it opens

Run commands from the main project folder, the folder that contains this README.

## Start The App

### macOS, Linux, or Windows WSL

```bash
bash start.sh
```

### Windows PowerShell

```powershell
python run_api.py
```

The launcher installs missing npm dependencies, starts the server and client, and opens the app in your browser.

If the browser does not open automatically, go to:

```text
http://localhost:5173
```

## Clean Restart

Use this if dependencies are stale, ports are stuck, or the app is not starting cleanly.

### macOS, Linux, or Windows WSL

```bash
bash start.sh --clean
```

### Windows PowerShell

```powershell
python run_api.py --clean
```

The clean restart removes installed dependencies and build output, frees the app ports when possible, reinstalls dependencies, and starts the app again.

## Daily Development

After dependencies are installed, you can also start the app directly:

```bash
npm run dev
```

This runs both workspaces:

- `server`: Express API on `http://localhost:8787`
- `client`: Vite React app on `http://localhost:5173`

Press `Ctrl+C` in the terminal to stop the app.

## Using The App

1. Open `http://localhost:5173`.
2. Add your OpenAI API key in Settings.
3. Select the local workspace folder you want the assistant to work in.
4. Start a chat.

## Troubleshooting

- If Node.js or npm is missing, install Node.js 18 or newer from https://nodejs.org.
- If Python is missing, install Python 3 from https://www.python.org.
- If `npm run dev` says `concurrently` is not recognized, run the launcher command first so dependencies are installed.
- If a port is already in use, run the clean restart command for your system.
- If dependency installation fails, close other terminals running the app and try the clean restart again.
