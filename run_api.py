#!/usr/bin/env python3
"""
Launcher for the Codex Local Assistant.

Usage:
    python run_api.py            # install deps if needed, then start
    python run_api.py --clean    # fresh start: free ports, wipe build artifacts,
                                  # reinstall dependencies, then start

What it does:
    1. Verifies Node.js / npm are installed.
    2. (--clean) Frees ports 8787/5173 and removes node_modules, dist, and other
       build artifacts so the next install is from scratch.
    3. Runs `npm install` when node_modules is missing (always, after --clean).
    4. Starts the dev servers via `npm run dev` (backend on :8787, UI on :5173).
    5. Opens the UI in your default browser.

Works on macOS, Linux, Windows (native), and Windows via WSL.
"""

import argparse
import glob
import os
import shutil
import subprocess
import sys
import threading
import time
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
UI_URL = "http://localhost:5173"
PORTS = (8787, 5173)  # backend, vite UI


def find(cmd):
    """Locate an executable, accounting for Windows .cmd/.exe shims."""
    return (
        shutil.which(cmd)
        or shutil.which(cmd + ".cmd")
        or shutil.which(cmd + ".exe")
    )


def run(args):
    """Run a command in the project root, streaming output. Returns exit code."""
    return subprocess.call(args, cwd=ROOT)


def free_ports(ports):
    """Best-effort: kill whatever is listening on the app's own dev ports so a
    stale instance doesn't cause EADDRINUSE on restart."""
    for port in ports:
        try:
            if os.name == "nt":
                # Windows native: find LISTENING pids via netstat, then taskkill.
                out = subprocess.run(
                    ["netstat", "-ano", "-p", "tcp"],
                    capture_output=True, text=True,
                ).stdout
                pids = set()
                for line in out.splitlines():
                    parts = line.split()
                    if len(parts) >= 5 and parts[1].endswith(f":{port}") and parts[3] == "LISTENING":
                        pids.add(parts[4])
                for pid in pids:
                    subprocess.run(["taskkill", "/F", "/PID", pid], capture_output=True)
                    print(f">> freed port {port} (pid {pid})")
            else:
                # macOS / Linux / WSL: lsof gives the listening pids.
                out = subprocess.run(
                    ["lsof", "-ti", f"tcp:{port}"],
                    capture_output=True, text=True,
                ).stdout
                for pid in out.split():
                    subprocess.run(["kill", "-9", pid], capture_output=True)
                    print(f">> freed port {port} (pid {pid})")
        except FileNotFoundError:
            pass  # lsof/netstat not available — nothing we can do, keep going.
        except Exception as e:
            print(f"   (couldn't free port {port}: {e})")


def clean_artifacts():
    """Remove build artifacts and installed dependencies for a from-scratch run.
    The package-lock.json is kept so the reinstall stays reproducible."""
    dirs = [
        "node_modules",
        os.path.join("client", "node_modules"),
        os.path.join("server", "node_modules"),
        "dist",
        os.path.join("client", "dist"),
    ]
    for rel in dirs:
        p = os.path.join(ROOT, rel)
        if os.path.isdir(p):
            print(f">> removing {rel}{os.sep}")
            shutil.rmtree(p, ignore_errors=True)

    patterns = [
        os.path.join("client", "vite.config.js.timestamp-*.mjs"),  # stale vite temp files
        "*.log",
        os.path.join("client", "*.log"),
        os.path.join("server", "*.log"),
    ]
    for pattern in patterns:
        for f in glob.glob(os.path.join(ROOT, pattern)):
            print(f">> removing {os.path.relpath(f, ROOT)}")
            try:
                os.remove(f)
            except OSError:
                pass


def open_browser_when_ready():
    """Open the UI once the dev server has had a moment to start."""
    time.sleep(4)
    webbrowser.open(UI_URL)


def main():
    parser = argparse.ArgumentParser(description="Launch the Codex Local Assistant.")
    parser.add_argument(
        "--clean", "--fresh",
        dest="clean",
        action="store_true",
        help="Free ports, remove node_modules/build artifacts, and reinstall before starting.",
    )
    args = parser.parse_args()

    npm = find("npm")
    if not npm:
        print("ERROR: npm was not found. Install Node.js 18+ from https://nodejs.org and retry.")
        sys.exit(1)

    if args.clean:
        print(">> Clean start: freeing ports and removing build artifacts...")
        free_ports(PORTS)
        clean_artifacts()

    if not os.path.isdir(os.path.join(ROOT, "node_modules")):
        print(">> Installing dependencies...")
        code = run([npm, "install"])
        if code != 0:
            print("ERROR: `npm install` failed.")
            sys.exit(code)

    print(f">> Starting Codex Local Assistant — opening {UI_URL}")
    print(">> Press Ctrl+C to stop.\n")

    threading.Thread(target=open_browser_when_ready, daemon=True).start()

    try:
        sys.exit(run([npm, "run", "dev"]))
    except KeyboardInterrupt:
        print("\n>> Stopped.")
        sys.exit(0)


if __name__ == "__main__":
    main()
