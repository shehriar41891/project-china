# Project Report — Neural Network Playground

**Date:** March 2025  
**Project:** FYP — Neural Network Playground (fyp-cheen)

---

## Overview

This report summarizes the work done on the **Neural Network Playground**: an interactive web app where users can design small neural networks with a drag-and-drop graph editor, run training in a visual playground, and follow a structured learning path with quizzes. The project includes a React-based front end, authentication, profile and progress tracking, an LLM-powered chatbot, and a classic playground for training visualization.

---

## Timeline

### Up to 13 March — First release

- **Home page** — Intro, single CTA (“Open Network Builder”), language dropdown (English / 中文 / 日本語), dark/light theme toggle, chatbot modal (demo replies in selected language), nav and footer.
- **Network Builder (graph editor)** — Dataset, Hidden Layer, Output Layer; drag-and-drop; connect Dataset → Hidden → Output; persistence (saved/restored); run training to classic Playground; “?” user guide; dark theme styling.
- **Classic Playground** — Dataset and activation drag-and-drop, step-by-step guide, training charts and visualizations, nav back to Network Builder and Home.
- **About page** — Same header (logo, language), about content in three languages, footer.
- **Build & fixes** — Dev and build setup (TypeScript, CSS) fixed so the app builds and runs.

### Up to 16 March — Second release

- **Authentication** — Login and signup (email, password, name); session-based auth; protected routes for Learn, Quiz, Profile.
- **Learning path** — 10 chapters on neural networks and deep learning (seeded in DB); chapter list page; chapter detail page with content, video links, doc links; “Take chapter quiz” per chapter.
- **Quizzes** — 6 questions per attempt; chapter-scoped or general; AI-generated questions (Mistral); adaptive retakes: same concepts, different questions, using past attempts and weak topics from the database; retake context stored for “Retake (adapted)” flow.
- **Profile (Udemy-style)** — Progress bar (chapters completed); stats (chapters completed, quizzes taken); chapter progress list; **quizzes by chapter** with best score and “Retake” when score &lt; 100%; progress by topic; LLM-generated recommendations; theme toggle.
- **Chatbot** — Connected to LLM (Mistral); real-time replies; optional **fullscreen** mode for the chat window.
- **Front end overhaul** — Migrated to **React SPA** (Vite + React Router); single app with routes: Home, Login, Signup, Learn, Chapter, Quiz, Profile, About; Editor/Playground remain static HTML. Modular layout, shared nav, theme and auth context.
- **Landing page** — Animated background (floating shapes, grid lines, dots); **5 images** (hero + 4 feature cards) with Popsy/Unsplash and fallbacks; **4 feature cards** (Visual Network Builder, Learning path, Adaptive quizzes, Progress & profile) with equal-height layout; guide section with image and CTAs.
- **Backend** — Express server; SQLite DB: users, chapters, chapter_progress, quiz_attempts, quiz_answers, store (graph + preferences); session auth; Mistral for quiz generation, retake context, chat, and profile recommendations; API for auth, chapters, quiz start/question/answer/complete, retake-context, profile.
- **Database** — Users (email, password_hash, name); chapters (title, content, video_links, doc_links); chapter_progress (per user per chapter, best quiz score); quiz_attempts (chapter_id, context_for_retake, score); quiz_answers (question, topic, correct/incorrect); store for saved graph and preferences.

---

## What We Have Done (detail)

### Home Page

- Short intro and a single call-to-action (“Open Network Builder”) instead of multiple cards.
- **Language dropdown** — English / 中文 / 日本語; choice is remembered.
- **Dark / Light mode** — Toggle in the header; preference is remembered.
- **Chatbot** — Button opens a modal with blurred background, message area, and demo replies in the selected language.
- Navigation to Network Builder and footer links (About, Home).

### Network Builder (Graph Editor)

- **Node types:** Dataset, Hidden Layer, Output Layer. No separate Input Layer — dataset connects directly to hidden layers.
- **Drag-and-drop** — Add nodes from a palette onto the canvas; connect them (Dataset → Hidden → Output); move or clear.
- **Persistence** — The built network is saved automatically and restored when the user returns (e.g. from the Playground), so it stays visible and editable.
- **Run training** — Validates the graph and opens the classic Playground with the chosen dataset, activation, and network shape.
- **User guide** — “?” button opens a short 4-step guide.
- Dark theme and clear styling for nodes and palette.

### Classic Playground (Training View)

- Drag-and-drop for dataset and activation; step-by-step guide and tooltips; training charts and visualizations.
- Navigation back to Network Builder and Home.

### About Page

- Same header (logo, language dropdown); about content in all three languages; footer with links.

### Build & Fixes

- Development and build setup fixed (TypeScript, CSS) so the app builds and runs correctly.

---

## Possible Future Work

- Add theme and language controls to the About page (and other secondary pages).
- Further UX (e.g. keyboard shortcuts, undo/redo in the editor).
- Optional: export/import of the graph.
- Rate limiting and security hardening for production.

---

*The **Timeline** section above is the main summary: up to 13 March (first release) and up to 16 March (second release).*
