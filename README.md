# KanjiGo ⛩️

KanjiGo is a modern, mobile-first web application designed to help users learn Japanese Kanji effectively. It features a sleek Duolingo-style interface, spaced repetition system (SRS) logic, and engaging interactions.

## Features ✨

- **Learn Kanji**: Practice reading and meanings of Japanese characters.
- **Spaced Repetition**: The app tracks your progress and prioritizes items you struggle with.
- **Interactive Quizzes**:
  - **Cards**: Large, clear Kanji cards with audio pronunciation (Text-to-Speech).
  - **Animations**: Fluid slide and pop animations for feedback.
  - **Haptics**: Vibration feedback for correct/incorrect answers (mobile).
  - **Gestures**: Swipe left to advance after answering.
- **JLPT Datasets**: Includes N5, N4, and N3 Kanji sets with example sentences.
- **Custom Sets**: Create your own study sets by selecting specific Kanji.
- **Stats**: Track your learning streaks, total reviews, and accuracy.
- **Responsive Design**: Optimized for mobile devices with a persistent bottom nav, while offering a centered, clean layout on desktop.

## Tech Stack 🛠️

- **Frontend**: React + TypeScript + Vite
- **Styling**: Vanilla CSS with CSS Variables (Theming support: Light/Dark mode)
- **State Management**: React Hooks & Context
- **Persistence**: IndexedDB (via `idb`) for robust local storage of progress.
- **Routing**: React Router DOM (GitHub Pages compatible).
- **Icons**: Lucide React.

## Getting Started 🚀

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
Start the development server:
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### Testing
- **Unit/Integration**: Run `npm run test` (if configured).
- **Manual Testing**:
  - Open the app in a mobile browser or simulator.
  - Test swipe gestures on the quiz feedback screen.
  - Verify haptic feedback on Android/iOS (if supported by browser).
  - Check desktop layout centering.

## Deployment 🌐

### GitHub Pages
The app is configured for GitHub Pages.

1. Update `vite.config.ts` with your repository name:
   ```typescript
   base: '/repo-name/',
   ```
2. Build the project:
   ```bash
   npm run build
   ```
3. Deploy the `dist` folder.

## Project Structure
- `public/kanji`: JSON datasets for JLPT levels.
- `src/components`: Reusable UI components.
- `src/pages`: Main application views (Home, Quiz, Manage, Stats).
- `src/hooks`: Custom hooks for logic (useQuiz, useKanji, useHaptics).
- `src/services`: Database and SRS logic.
- `src/i18n`: Localization files.

## License
MIT
