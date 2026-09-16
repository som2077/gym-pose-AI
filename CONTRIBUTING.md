# Contributing to GYM Pose AI 🏋️‍♂️

First off, thank you for considering contributing to **GYM Pose AI**! Projects like this thrive because of developers, fitness enthusiasts, and AI engineers like you.

Please take a moment to review this document to make the contribution process simple and effective for everyone.

---

## 📜 Code of Conduct

This project and everyone participating in it are governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [somgautam2077@gmail.com](mailto:somgautam2077@gmail.com).

---

## 🛠️ How Can You Contribute?

You can contribute in several ways:
- **Reporting Bugs:** Help us identify issues, crashes, or inaccurate pose detection.
- **Suggesting Features:** Propose new exercises, UI/UX improvements, or workout modes.
- **Adding Exercises:** Expand our biomechanical exercise configuration library.
- **Improving Documentation:** Clarify guides, add diagrams, or fix typos.
- **Submitting Code:** Fix open issues or implement features via Pull Requests.

---

## 🚀 Development Setup

### 1. Fork & Clone
```bash
git clone https://github.com/<your-username>/gym-pose-AI.git
cd gym-pose-AI
```

### 2. Install Dependencies
```bash
npm install
```
> *Note:* `npm install` triggers our `postinstall` script, applying required native Android patches to `react-native-nitro-pose-exercises`.

### 3. Verify Local Build
Make sure everything is clean before making changes:
```bash
# Verify TypeScript types
npm run typecheck

# Run native buffer memory safety tests
npm test
```

### 4. Running the App
Connect an Android device via USB with USB debugging enabled:
```bash
npm run android
```

---

## 🏋️ Adding a New Exercise

GYM Pose AI is designed with a config-driven rule engine. Adding an exercise does not require changing core rendering or frame processor logic!

1. Open [`src/features/exercises/config.ts`](file:///home/som2077/Desktop/gym-pose-AI/src/features/exercises/config.ts).
2. Define the new exercise using the `ExerciseConfig` interface:
   - Identify the joint keypoints needed for tracking (refer to MediaPipe 33 landmark indices).
   - Set the `start` (UP) and `end` (DOWN) angular thresholds.
   - Define common form errors with human-readable error messages and voice prompts.
3. Test the angle calculations on your device to ensure reliable repetition counting without false positives.
4. Update [`README.md`](file:///home/som2077/Desktop/gym-pose-AI/README.md) to reflect the new exercise in the supported list.

---

## 🌿 Git & Workflow Guidelines

### Branch Naming
Create a descriptive branch name indicating the nature of the change:
- `feat/<feature-name>` (e.g. `feat/lunge-exercise`)
- `fix/<bug-description>` (e.g. `fix/speech-cooldown-timer`)
- `docs/<documentation-change>` (e.g. `docs/update-architecture`)
- `refactor/<cleanup>` (e.g. `refactor/rep-state-machine`)

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**
- `feat`: A new feature or exercise
- `fix`: A bug fix
- `docs`: Documentation changes only
- `style`: Formatting, missing semi-colons, whitespace
- `refactor`: Code refactoring without behavioral changes
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `chore`: Build scripts, dependencies, configuration

**Example:**
```bash
git commit -m "feat(exercises): add dumbbell overhead press rule configuration"
```

---

## 📋 Pull Request Process

1. Ensure your code passes all type checks and tests:
   ```bash
   npm run typecheck
   npm test
   ```
2. Update relevant documentation if you changed public APIs or added features.
3. Push your branch to your GitHub fork:
   ```bash
   git push origin feat/your-feature
   ```
4. Open a Pull Request against the `main` branch of `som2077/gym-pose-AI`.
5. Fill out the provided Pull Request template with details about your changes and testing notes.
6. Once submitted, CI will automatically run tests. Address any review comments or feedback promptly.

---

Thank you for helping make GYM Pose AI better! 🚀
