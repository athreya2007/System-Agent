# Ollama + OpenClaw Local Setup & Progress History

> **Date:** October 28–29, 2026  
> **Workspace:** `c:\Users\acer\Projects\System-Agent`  
> **Status:** Setup complete, background processes stopped, ready to resume on demand.

---

## 1. Objective & Hardware Constraints

- **Goal:** Set up local LLM inference via **Ollama** on **D: drive** (to avoid exhausting the limited ~23 GB free space on C: drive), select the optimal model for the laptop hardware, integrate it into OpenClaw, and run OpenClaw locally with tool calling.
- **Laptop Hardware Specifications:**
  - **CPU:** Intel Core Ultra 5 125H (14 cores, 18 threads: 4 Performance cores, 8 Efficient cores, 2 Low Power cores)
  - **RAM:** 16 GB LPDDR5/DDR5 (~15.5 GB usable)
  - **GPU:** Intel Arc Integrated Graphics (Intel Arc iGPU)
  - **Disk Configuration:**
    - `C:\` Drive: System drive (restricted free space, preserved throughout the session).
    - `D:\` Drive: Fast secondary storage (~520 GB free space).
- **Optimal Model Selected:** **`qwen2.5:7b`**
  - **Why:** 7B parameters fits comfortably inside ~5 GB of RAM/VRAM, leaving ample system memory for Node.js, OpenClaw processes, and OS tasks. Native tool/function calling support is first-class, with high accuracy in coding and reasoning tasks.

---

## 2. Directory & Storage Layout on D: Drive

All large assets, models, binaries, and package caches were strictly kept on the **D:** drive:

| Asset | Path | Description |
| :--- | :--- | :--- |
| **Ollama Binaries** | `D:\Projects\Ollama\` | Extracted Ollama executable and runtime files |
| **Ollama Models** | `D:\Projects\Ollama\models\` | Model blobs and manifests (`qwen2.5:7b`, ~4.7 GB) |
| **pnpm Global Store** | `D:\Projects\.pnpm-store\` | Global package store for 204 monorepo packages |
| **Installer File** | `D:\Projects\OllamaSetup.exe` | Downloaded installer (can be removed if desired) |

---

## 3. Environment Variables Configured

The following user-level environment variables were permanently set in the system registry:

```powershell
OLLAMA_MODELS = "D:\Projects\Ollama\models"
OLLAMA_IGPU_ENABLE = "1"
OLLAMA_API_KEY = "ollama-local"
Path += ";D:\Projects\Ollama"
```

---

## 4. Key Actions & Fixes Completed

### A. Ollama Installation & Verification
1. Downloaded `OllamaSetup.exe` to `D:\Projects\OllamaSetup.exe`.
2. Extracted and installed Ollama into `D:\Projects\Ollama\`.
3. Started `ollama serve` and pulled the `qwen2.5:7b` model to `D:\Projects\Ollama\models`.
4. Verified direct API responses on `http://127.0.0.1:11434/api/tags` and tested prompt generation (`Hello from Ollama on D drive!`).

### B. Dependency Setup & Node 24 Patches
1. Configured pnpm store directory to `D:\Projects\.pnpm-store` to prevent caching on `C:`.
2. Installed dependencies across all 204 packages in the workspace (`pnpm install`).
3. Adjusted Node version gating checks to permit the system's Node `v24.14.1` on local development runs.
4. Addressed node:sqlite NUL truncation and WAL-reset preflight checks in CLI and worker files.
5. Built runtime bundles with `scripts/tsdown-build.mts`.

### C. OpenClaw Model & Gateway Configuration
Configuration file updated at `C:\Users\acer\.openclaw\openclaw.json`:
- **Provider:** `ollama` (`baseUrl: "http://127.0.0.1:11434"`, `api: "ollama"`).
- **Model Definition:**
  ```json
  {
    "id": "qwen2.5:7b",
    "name": "qwen2.5:7b",
    "contextWindow": 32768,
    "maxTokens": 8192,
    "params": {
      "num_ctx": 32768
    }
  }
  ```
- **Agent Defaults & Entries:** Primary model assigned to `ollama/qwen2.5:7b`.
- **Gateway Auth:** Configured token `openclaw-test-token`.
- Verified status with `node openclaw.mjs models status` (returned exit code 0, `Default: ollama/qwen2.5:7b`).

### D. Architectural Findings & Context Window Fix
1. **Gateway vs Embedded Mode:**
   - Standalone headless execution (`openclaw agent exec`) spins up temporary SQLite worker databases for each run, which incurs significant overhead scanning 50+ workspace extensions on Windows.
   - The native OpenClaw architecture is the **WebSocket Gateway** (`openclaw gateway run`), which pre-boots and caches all plugins/state, listening on `127.0.0.1:18789` with a Web Control Dashboard at `http://127.0.0.1:18789/`.
2. **Context Size Limitation Fix:**
   - The default context window reported by Ollama for raw local runs is 2,048 tokens. OpenClaw's complete system prompt and tool schema definitions exceed 2,048 tokens.
   - We updated `openclaw.json` with `"contextWindow": 32768` and `"params": { "num_ctx": 32768 }` to allow Qwen 2.5 to handle long prompts and extensive tool sets cleanly.

---

## 5. Current State

- All background tasks (`ollama serve` and `openclaw gateway`) have been **gracefully stopped**.
- No dangling processes are running.
- All configuration, models, and build artifacts are intact and persistent on disk.

---

## 6. How to Resume Later

When you are ready to continue, follow these simple steps:

### Step 1: Start Ollama
In a PowerShell window:
```powershell
$env:OLLAMA_MODELS = "D:\Projects\Ollama\models"
& "D:\Projects\Ollama\ollama.exe" serve
```
*(Verify it is ready by visiting `http://127.0.0.1:11434` or running `curl http://127.0.0.1:11434/api/tags`)*

### Step 2: Start OpenClaw Gateway
In a second terminal inside `c:\Users\acer\Projects\System-Agent`:
```powershell
node openclaw.mjs gateway run --allow-unconfigured
```
*(The Gateway will start, connect to Ollama, and host the web dashboard at `http://127.0.0.1:18789/`)*

### Step 3: Run an Agent Turn or Use the Dashboard
- **Via CLI:**
  ```powershell
  node openclaw.mjs agent --message "Hello from Ollama!"
  ```
- **Via Web UI:**
  Open `http://127.0.0.1:18789/` in your browser to interact with OpenClaw visually.
