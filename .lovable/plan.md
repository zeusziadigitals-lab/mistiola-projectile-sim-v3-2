

## Documentation generation plan

I'll generate three downloadable documentation files and also surface them inside the web app for easy access.

### Deliverables (downloadable from chat)

1. **`README.md`** — written into the project repo (replaces current placeholder)
2. **`Projectile_Motion_Simulator_Documentation.pdf`** — formal documentation, downloadable from `/mnt/documents/`
3. **`Projectile_Motion_Simulator_Documentation.docx`** — editable Word version, downloadable from `/mnt/documents/`

All three will appear as download chips in chat. The PDF and DOCX also persist in your **Files** view (Files icon in nav bar on desktop, or `…` → Files on mobile).

### In-app integration

Add a **"Documentation"** section to the existing **About dialog** with two download buttons:

- **Download PDF** → links to the hosted PDF
- **Download DOCX** → links to the hosted DOCX

The files will be placed in `public/docs/` inside the project so they're served as static assets at:
- `/docs/Projectile_Motion_Simulator_Documentation.pdf`
- `/docs/Projectile_Motion_Simulator_Documentation.docx`

This means anyone visiting your published site (`mistiola-projectile-v3-2-beta.lovable.app`) can download them directly — perfect for sharing with students.

### Documentation contents (PDF + DOCX)

Cover page → Table of contents → 7 numbered sections:

1. **Overview** — purpose, version 3.2.0, audience (Grade 11/12 General Physics 1), key features
2. **User Guide** — controls, playback, display options, Educational vs Physics modes, draggable HUD, mobile/desktop views, About & onboarding
3. **Physics Explanation** — coordinate system, core kinematic equations (Vx, Vy, t, H, R), linear drag model, analytical vs simulation difference
4. **Technical Documentation** — tech stack, ASCII architecture diagram, module breakdown (`analyticPhysics.ts`, `physics.ts`, `useSimulation.ts`, `sounds.ts`, components), localStorage keys, testing setup
5. **Installation & Setup** — Node.js 18+, clone, `npm install`, `npm run dev`, scripts, deployment
6. **Known Limitations** — linear drag only, no wind/spin/Magnus, 2D only, single projectile, fixed ground, WebAudio gesture requirement
7. **Future Improvements** — quadratic drag, multiple projectiles, terrain, energy graphs, CSV export, problem sets, multilingual, PWA

Style: Arial body, numbered headings, monospaced formula blocks, US Letter, 1" margins, page numbers in footer, credit to **Sir Rene D. Mistiola** on cover.

### Files to be created/edited

- **Created**: `public/docs/Projectile_Motion_Simulator_Documentation.pdf`
- **Created**: `public/docs/Projectile_Motion_Simulator_Documentation.docx`
- **Created**: `/mnt/documents/Projectile_Motion_Simulator_Documentation.pdf` (for chat download)
- **Created**: `/mnt/documents/Projectile_Motion_Simulator_Documentation.docx` (for chat download)
- **Overwritten**: `README.md`
- **Edited**: `src/components/AboutDialog.tsx` (add Documentation section with download buttons)

### Process

1. Generate DOCX with `docx-js` (US Letter, validated)
2. Convert DOCX → PDF via LibreOffice
3. QA: render each PDF page to image and inspect for layout issues; iterate if needed
4. Copy both into `public/docs/` and `/mnt/documents/`
5. Write `README.md`
6. Add Documentation section to About dialog
7. Emit `<lov-artifact>` chips for both downloads

After approval I'll switch to default mode and produce all files.

