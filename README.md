# Projectile Motion Simulator

An interactive, browser-based educational tool that helps senior high school students visualize and understand the physics of projectile motion. Built to support the **Technology-Mediated Strategic Intervention Material (TMSIM)** developed by **Sir Rene D. Mistiola** — Department of Education, Schools Division of Batangas.

**Live app:** https://mistiola-projectile-v3-2-beta.lovable.app
**Version:** 3.2.0

---

## Features

- Real-time 60 FPS animated trajectory on HTML5 Canvas
- Adjustable initial velocity, launch angle (deg/rad), height, mass, and gravity
- Optional linear air drag with adjustable coefficient
- Educational vs Physics display modes (rounded vs precise)
- Draggable, collapsible Live / Final / Target stat cards
- Mobile and desktop view layouts (preference persisted)
- Futuristic sound effects, dismissible onboarding, dark/light themes
- Preset scenarios for quick exploration

## Tech Stack

- **React 18** + **TypeScript 5**
- **Vite 5** (dev server & build)
- **Tailwind CSS v3** + **shadcn/ui** (Radix primitives)
- **HTML5 Canvas** + **WebAudio API**
- **Vitest** for unit tests

## Getting Started

### Prerequisites
- Node.js 18+
- npm (or bun)

### Install & Run
```bash
npm install
npm run dev
```
Open http://localhost:8080.

### Scripts
| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint check |
| `npm run test` | Run Vitest once |
| `npm run test:watch` | Vitest in watch mode |

## Project Structure

```
src/
├── components/         UI components (ControlPanel, SimulationCanvas, StatsHUD, ...)
├── hooks/
│   └── useSimulation.ts    Animation loop & state orchestration
├── lib/
│   ├── analyticPhysics.ts  Closed-form formulas (HUD source of truth)
│   ├── physics.ts          Semi-implicit Euler integrator
│   └── sounds.ts           WebAudio SFX
├── pages/              Route components
└── test/               Vitest setup & tests
public/
└── docs/               Downloadable PDF + DOCX documentation
```

## Documentation

Full documentation is available in two formats and accessible from the in-app **About** dialog:

- [Projectile Motion Simulator Documentation (PDF)](./public/docs/Projectile_Motion_Simulator_Documentation.pdf)
- [Projectile Motion Simulator Documentation (DOCX)](./public/docs/Projectile_Motion_Simulator_Documentation.docx)

Sections covered: Overview · User Guide · Physics Explanation · Technical Documentation · Installation & Setup · Known Limitations · Future Improvements.

## Physics Summary

Standard 2D Cartesian system with gravity in the −y direction.

```
Vx = Vi · cos(θ)
Vy = Vi · sin(θ)
t  = ( Vy + √( Vy² + 2·g·h ) ) / g
H  = Vy² / (2·g) + h
R  = Vx · t
```

With air drag enabled: `F_drag = −k · v` (linear), integrated via semi-implicit Euler.

## Credits

Based on the **Technology-Mediated Strategic Intervention Material in General Physics 1** by **Sir Rene D. Mistiola** — Department of Education, Schools Division of Batangas.

## License

Educational use.
