# Project Report — Neural Network Playground

**Date:** March 2025  
**Project:** FYP — Neural Network Playground (fyp-cheen)

---

## Overview

This report summarizes the work done on the **Neural Network Playground**: an interactive web app where users can design small neural networks with a drag-and-drop graph editor, then run training in a visual playground. The project includes a home page with language selection, theme toggle, and a chatbot modal, plus an About page and a classic playground for training visualization.

---

## What We Have Done

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

- Connect the chatbot to a real API or model.
- Add theme and language controls to the About page.
- Further UX (e.g. keyboard shortcuts, undo/redo in the editor).
- Optional: export/import of the graph.

---

*End of report.*
