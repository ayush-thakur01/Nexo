<div align="center">

<img src="assets/nexo-splash.png" alt="Nexo" width="220"/>

# Nexo

### A premium Dynamic Island-style desktop experience for Windows.

**Nexo** is a lightweight Windows desktop widget that brings an adaptive, always-available interface to your desktop — surfacing system activity, media, controls, notifications, and useful actions without taking over your screen.

<p>
  <a href="#-features">Features</a> •
  <a href="#-download">Download</a> •
  <a href="#-getting-started">Development</a> •
  <a href="#-architecture">Architecture</a>
</p>

<p>
  <img src="https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D4?style=flat-square&logo=windows&logoColor=white" alt="Windows"/>
  <img src="https://img.shields.io/badge/Electron-28-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License"/>
</p>

</div>

---

## 🖥️ Preview

<p align="center">
  <img src="assets/nexo-preview.png" alt="Nexo running on Windows" width="100%"/>
</p>

> Nexo stays compact when the desktop is idle and expands around the information or control you need.

---

## ✨ Why Nexo?

Most desktop widgets behave like traditional panels that permanently occupy screen space.

Nexo takes a different approach:

> **Stay minimal by default. Expand when something matters.**

The goal is to combine:

- **Minimal desktop UI**
- **Real-time system awareness**
- **Native Windows controls**
- **Smooth, spring-based animations**
- **A focused, distraction-free experience**

into one small desktop surface.

---

## 🚀 Features

### 🎵 Media

- Current track and playback state
- Play / pause
- Previous / next
- Compact and expanded media views

### 🔊 System Controls

- Volume control
- Mute / unmute
- Display brightness
- Wi-Fi controls
- Bluetooth controls
- Airplane mode
- Night Light
- Focus controls

### 📊 System Monitoring

- Battery status
- Network connection
- Network speed
- CPU / memory / disk information
- System uptime
- Microphone activity
- Camera activity

### 🔔 Activity & Notifications

- Windows/application notifications
- Download activity
- Clipboard activity
- Context-aware activity widgets
- Priority-based activity switching

### ⚡ Quick Controls

A dedicated control panel for frequently used Windows actions without opening multiple system settings pages.

### 🤖 AI Panel

An integrated AI-oriented interaction layer designed to make Nexo more than a passive widget.

### ⚙️ Settings

- Theme and appearance controls
- Transparency
- Blur intensity
- Animation speed
- Notification behavior
- Startup behavior
- Widget preferences
- Always-on-top / pinned behavior

---

## 🎨 Adaptive Interface

Nexo uses a centralized activity manager to decide what the island should display.

Instead of every widget fighting for attention:

```text
System Event
     │
     ▼
Activity Manager
     │
     ├── Sustained activity
     │      ├── Media
     │      └── Microphone
     │
     ├── Transient activity
     │      ├── Volume
     │      ├── Brightness
     │      ├── Battery
     │      └── Network
     │
     └── Notification
             │
             ▼
        Nexo Interface
```

This keeps the interface stable while allowing important events to take priority.

---

## 🏗️ Architecture

Nexo is split into three major layers:

```text
┌───────────────────────────────────────────────┐
│                 React Renderer                │
│                                               │
│ Components • Hooks • Zustand • Animations     │
└───────────────────────┬───────────────────────┘
                        │
                       IPC
                        │
┌───────────────────────▼───────────────────────┐
│              Electron Main Process            │
│                                               │
│ Window • IPC • Lifecycle • Services           │
└───────────────────────┬───────────────────────┘
                        │
                 Native Bridge
                        │
┌───────────────────────▼───────────────────────┐
│              Windows / System APIs             │
│                                               │
│ Audio • Network • Battery • Bluetooth • etc.  │
└───────────────────────────────────────────────┘
```

### Application flow

```text
Windows / System
       ↓
Native Bridge
       ↓
Electron Main
       ↓
IPC
       ↓
Preload
       ↓
React Renderer
       ↓
Nexo UI
```

Privileged operations remain outside the React renderer, keeping the renderer isolated from direct Node.js/system access.

---

## 🧩 Project Structure

```text
nexo/
│
├── bridge/                 # PowerShell native Windows bridge
│
├── electron/               # Electron main-process code
│   ├── services/
│   ├── config.ts
│   ├── ipc.ts
│   ├── main.ts
│   ├── nativeBridge.ts
│   ├── preload.ts
│   └── tsconfig.json
│
├── src/                    # React renderer
│   ├── animations/         # Springs and transitions
│   ├── assets/             # UI assets
│   ├── components/         # Nexo widgets and panels
│   ├── hooks/              # System and UI hooks
│   ├── ipc/                # Shared IPC channels
│   ├── services/           # Renderer services
│   ├── store/              # Zustand application state
│   ├── system/             # Settings/startup logic
│   ├── types/              # Shared TypeScript types
│   ├── utils/              # Helpers/activity management
│   ├── widgets/            # Widget-level UI
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── public/                 # Static assets
│
├── electron-builder.js     # Windows packaging configuration
├── index.html
├── install.ps1
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.renderer.json
└── vite.config.ts
```

> Generated build output, packaged installers, logs, `node_modules`, and temporary test files should stay out of the source structure and should be ignored by Git.

---

## 🛠️ Tech Stack

| Technology | Role |
|---|---|
| **Electron** | Windows desktop runtime |
| **React** | UI and component system |
| **TypeScript** | Type-safe application development |
| **Vite** | Frontend development and build tooling |
| **Tailwind CSS** | UI styling |
| **Zustand** | Global application state |
| **Framer Motion** | Animations and transitions |
| **Electron IPC** | Renderer ↔ main-process communication |
| **PowerShell** | Windows/system bridge |
| **Electron Builder** | Windows installer packaging |

---

## 📋 Requirements

- Windows 10 or Windows 11
- Node.js 18+
- npm
- Git

Some system-level controls may require **administrator privileges**.

---

## 📥 Download

The easiest way to try Nexo is to download the latest Windows installer from GitHub Releases.

**[Download Nexo →](https://github.com/ayush-thakur01/Nexo/releases/latest)**

### Installation

1. Download the latest `Nexo Setup.exe`.
2. Run the installer.
3. Choose the installation directory if prompted.
4. Launch **Nexo**.
5. Allow administrator privileges when Windows asks for them.

> Windows SmartScreen may display a warning for unsigned builds. Nexo is currently distributed as an unsigned Windows application.

---

## 💻 Getting Started

### Clone

```bash
git clone https://github.com/ayush-thakur01/Nexo.git
cd Nexo
```

### Install dependencies

```bash
npm install
```

### Start development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Create Windows installer

```bash
npm run dist
```

The packaged output is generated in:

```text
dist-electron/
```

---

## 🔌 Electron IPC

Nexo uses a controlled IPC layer between the renderer and Electron.

```text
React Component
      ↓
React Hook
      ↓
Preload API
      ↓
IPC Channel
      ↓
Electron Main
      ↓
Native Bridge
      ↓
Windows
```

Important Electron modules:

```text
electron/
├── main.ts
├── preload.ts
├── ipc.ts
├── nativeBridge.ts
└── services/
```

The preload layer exposes only the APIs required by the renderer instead of enabling direct Node.js access.

---

## 🎞️ Animation System

Animations are separated from component logic:

```text
src/animations/
├── config.ts
├── springs.ts
└── transitions.ts
```

This makes expansion and collapse behavior easier to tune without scattering animation constants throughout the UI.

---

## 🧠 State Management

Nexo uses Zustand for centralized application state.

The store manages areas such as:

- Settings
- Current widget
- Media
- Volume
- Battery
- Brightness
- Network
- Notifications
- Clipboard
- Downloads
- Quick Controls
- Bluetooth devices
- Wi-Fi networks
- Timers
- Stopwatch
- UI panels

---

## 🔐 Security Model

Nexo follows Electron's process separation model:

- `contextIsolation` enabled
- `nodeIntegration` disabled in the renderer
- Native/system operations handled outside React
- IPC used as the communication boundary
- Privileged actions checked before execution

This architecture helps reduce unnecessary access from the renderer to the underlying system.

---

## 🤝 Contributing

Contributions, bug reports, feature ideas, and UI improvements are welcome.

### Create a feature branch

```bash
git checkout -b feature/your-feature
```

### Make your changes

### Commit

```bash
git add .
git commit -m "feat: add your feature"
```

### Push

```bash
git push origin feature/your-feature
```

Then open a Pull Request.

Please keep changes focused and describe what was changed and why.

---

## 🐛 Issues & Feature Requests

Found a bug or have an idea?

Open an issue in the repository with:

- What happened
- What you expected
- Steps to reproduce
- Windows version
- Relevant logs or screenshots

---

## 📄 License

Nexo is released under the **MIT License**.

See [`LICENSE`](LICENSE) for details.

---

## 👨‍💻 Author

**Ayush**

Computer Science Engineering Student

Interested in software development, backend engineering, desktop applications, and AI-powered products.

---

## ⭐ Support

If you like Nexo, consider giving the repository a ⭐.

It helps the project get discovered and motivates continued development.

---

<div align="center">

### Nexo

**A small interface for a smarter Windows desktop.**

Made with ❤️ and TypeScript.

</div>
