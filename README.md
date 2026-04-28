<div align="center">

# 🧠 CortiTick

**Pomodoro Timer · Task Manager · Cortisol Stress Gauge**

*Stay focused. Stay balanced. Stay healthy.*

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-State_Management-FF6B35?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Deploy](https://img.shields.io/badge/GitHub_Pages-Live-2ea44f?style=for-the-badge&logo=github)](https://quanvo0112.github.io/CortiTick)

<br/>

![CortiTick Dashboard Preview](https://via.placeholder.com/900x500/1e1b4b/a78bfa?text=CortiTick+Dashboard)

</div>

---

## 📖 Description

**CortiTick** is a productivity web app that goes beyond a traditional Pomodoro timer. Most focus tools tell you *when* to work and *when* to break — but they ignore how your body actually feels in the process.

CortiTick introduces a **Cortisol Level Gauge**: a dynamic, real-time stress indicator that responds to your behavior throughout the session. Skip too many breaks, overload your task list, or push past your limits? Your cortisol gauge will show it. It's a visual nudge to help you work sustainably, not just productively.

> **The problem it solves:** Burnout often sneaks up silently. CortiTick makes stress *visible* so you can act on it before it's too late.

---

## ✨ Features

- **🍅 Pomodoro Timer**
  - Configurable Work and Break session durations (1–120 min work, 1–60 min break)
  - Smooth animated circular progress ring
  - Auto-detection when a session ends, updating your stress level automatically

- **📋 Task Manager**
  - Add, complete, and delete tasks on the fly
  - Separate views for Pending and Completed tasks
  - Adding tasks during a session nudges the cortisol level upward

- **🧪 Dynamic Cortisol Gauge**
  - A real-time semicircular gauge displaying your current estimated stress level (0–100%)
  - Color-coded: 🟢 Low → 🟡 Normal → 🔴 High
  - Reacts to: session completions, skipped breaks, and task load

- **⚙️ Customizable Settings**
  - Adjust work and break durations at any time via the Settings modal
  - Theme switcher: 🌙 Dark mode / ☀️ Light mode

- **📱 Fully Responsive**
  - Clean two-column dashboard layout on desktop, single-column stacked on mobile

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **Deployment** | [GitHub Pages](https://pages.github.com/) via GitHub Actions |

---

## 🚀 Getting Started

Follow these steps to run CortiTick locally on your machine.

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- [Git](https://git-scm.com/)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/quanvo0112/CortiTick.git
cd CortiTick
```

**2. Install dependencies**
```bash
npm install
```

**3. Start the development server**
```bash
npm run dev
```

**4. Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) — the app will hot-reload as you make changes.

---

## 📦 Build for Production

To generate a fully static export (as used in the GitHub Pages deployment):

```bash
npm run build
```

The output will be in the `./out` directory, ready to be served from any static file host.

---

## 🌐 Deployment

CortiTick is continuously deployed to **GitHub Pages** via a GitHub Actions workflow (`.github/workflows/deploy.yml`).

Every push to the `main` branch automatically:
1. Installs dependencies & runs `npm run build`
2. Uploads the `./out` static export as a Pages artifact
3. Deploys it live

**🔗 Live URL:** [https://quanvo0112.github.io/CortiTick](https://quanvo0112.github.io/CortiTick)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

Please follow the existing code style and keep PRs focused on a single concern.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by [quanvo0112](https://github.com/quanvo0112)

</div>
