# Contributing to JSONObject.OnLine

Thank you for your interest in improving JSONObject.OnLine! We welcome contributions from developers of all skill levels. This guide outlines the setup procedures, coding standards, testing instructions, and pull request workflows to help you make successful contributions.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md) in all community spaces and interactions.

---

## 1. Local Development Setup

We use **pnpm** as our primary package manager. Make sure you have Node.js (v18+) and pnpm installed.

### 1.1 installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/json-formatter.git
   cd json-formatter
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```

### 1.2 Configuration (Supabase or Mock Database)

JSONObject.OnLine features a zero-knowledge encrypted sharing mechanism powered by Supabase. You can choose to run with a real connection or utilize our offline mock storage fallback.

- **Option A: Real Connection**
  Create a `.env` file at the root of the project:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
  ```
  Run the SQL queries in `schema.sql` inside your Supabase SQL editor to create the snippets table.

- **Option B: Offline Mock Storage (Recommended for local dev)**
  If you do not create a `.env` file, the client will **automatically** route snippets to local storage and a mock endpoint `/api/mock-share`. Snippets will persist locally inside your browser's `localStorage` and a local JSON file (`tmp/mock_snippets.json`), allowing you to test snippet loading/saving without a Supabase account.

### 1.3 Running the Dev Server

Start the Next.js development server:
```bash
pnpm dev
```
Open `http://localhost:3000` to preview your changes.

---

## 2. Directory Layout & Architecture

Before modifying code, familiarize yourself with our project structure:

- **`app/`**: Next.js App Router endpoints, pages, and global styling.
  - `globals.css`: Tailwind CSS v4 styling rules, custom scrollbars, and premium animations.
  - `page.tsx`: The primary dashboard workspace, resizable panels, and header elements.
  - `share/[id]/page.tsx`: Dynamic routing for zero-knowledge decryption.
- **`components/`**: Collapsible UI elements.
  - `JSONEditor.tsx`: Monaco Editor config, custom theme (`zen-dark`), cursor tracker, and paste interceptor.
  - `JSONTreeView.tsx`: Collapsible tree view showing keys categorized by parent vs child styles.
- **`store/`**: Centralized state management.
  - `store.ts`: Zustand store managing inputs, metrics, converted states, and view modes.
- **`utils/`**: Core utilities and type generators.
  - `jsonUtils.ts`: Parsing wrappers, metrics calculator, converters, and client-side encryption.
  - `typeGenerator.ts`: Compiles raw JSON structures into TS interfaces, Go tags, Rust structs, Python models, and Java class definitions.

---

## 3. Coding Standards & Guidelines

### 3.1 Styling (Tailwind CSS v4)
- We use **Tailwind CSS v4** for styling.
- All styles should match our premium dark aesthetic (deep zinc background `#09090b`, clean borders, and cyan/violet interactive highlights).
- Avoid inline styling. Rely on Tailwind classes (`transition-all`, `duration-300`, `group-hover:scale-105`) to create responsive and micro-animated layouts.

### 3.2 State Management (Zustand)
- Shared states (such as active JSON inputs, view modes, errors, etc.) must be stored in the Zustand store (`store/store.ts`).
- Avoid prop-drilling. Connect components directly to the store using selector hooks.

### 3.3 TypeScript
- Avoid using `any` typings. Write strict, complete types/interfaces for all utility functions, store states, and component props.
- Keep helper functions modular, deterministic, and exported under `utils/` to facilitate isolated unit testing.

---

## 4. Testing Guidelines

We use **Vitest** for running unit test suites.
- If you are adding a utility function, parser, or converter, you **must** add corresponding test assertions.
- Test specs should be placed in the same folder as the utility file, named `[filename].test.ts`.

### Running Tests
To run all tests in execution mode:
```bash
pnpm test
```
To run tests in watch/interactive mode:
```bash
pnpm test:watch
```

Ensure that all test suites pass successfully before proposing changes.

---

## 5. Branch Workflow & Commits

We follow standard open-source branch models and Conventional Commit standards.

### 5.1 Branch Naming Conventions
Create descriptive feature branches off the `main` branch:
- For new features: `feature/your-feature-name`
- For bug fixes: `bugfix/your-fix-name`
- For documentation updates: `docs/your-doc-name`
- For styling tweaks: `style/your-tweak-name`

### 5.2 Commit Message Format
Commit messages should follow the [Conventional Commits](https://www.conventionalcommits.org/) format:
```
<type>(<scope>): <short description>
```
Types include:
- `feat`: A new feature (e.g. `feat(tree): support parent-child key color highlights`)
- `fix`: A bug fix (e.g. `fix(layout): prevent height collapse in monaco wrapper`)
- `docs`: Documentation edits (e.g. `docs(readme): add environment details`)
- `style`: Layout, alignment, or theme changes (e.g. `style(footer): adjust date spacing`)
- `refactor`: Code reorganization with no functional changes
- `test`: Adding or correcting tests

---

## 6. Pull Request Checklist

Before submitting a Pull Request, verify the following:
1. [ ] **Build Check**: Run `pnpm run build` locally and ensure it compiles successfully with no TypeScript compilation errors.
2. [ ] **Lint Check**: Run `pnpm run lint` and ensure there are no formatting or syntax warnings.
3. [ ] **Tests Pass**: Run `pnpm test` and verify all test suites succeed.
4. [ ] **Clean Code**: Remove unnecessary `console.log` statements or commented-out debug code.
5. [ ] **Descriptive PR**: Provide a clear explanation of what problem is solved and list all modified components in the PR summary.
