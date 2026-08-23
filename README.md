# Img Tools 🛠️

A fast, client-side suite of image manipulation tools that runs entirely in your browser. Since processing is done on the client side, no image data or tracking information is sent to any server.

**Live Site:** [img-tools.namvo.net](https://img-tools.namvo.net/)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v22.18.0` (as defined in `.nvmrc`)
- **Yarn**: `v4.9.2` (managed via Corepack)

### Setup & Run

1. **Enable Corepack**:
   This project uses Yarn v4. Corepack ensures the correct Yarn binary is used.
   ```bash
   corepack enable
   ```

2. **Install Dependencies**:
   ```bash
   yarn install
   ```

3. **Start Development Server**:
   ```bash
   yarn dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Production Build**:
   ```bash
   yarn build
   ```
   The built assets will be placed in the `build/` directory.

5. **Linting**:
   ```bash
   yarn lint
   ```

---

## 📁 Project Structure

Below is the directory structure for the application code located in the `src/` directory:

```text
src/
├── assets/        # Static assets (icons, images, styles)
├── components/    # Reusable UI React components
│   ├── ui/        # Shared presentation components (shadcn/ui layout modules)
│   └── ...        # Feature-specific components (e.g. ImageDropZone, modals)
├── constants/     # Global configurations and fixed constants
├── pages/         # High-level page components representing individual tools
├── services/      # Business logic and helpers (web worker queue, processing)
└── utils/         # Lightweight utility functions (CSS classes, general helpers)
```
