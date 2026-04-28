# Usage Guide

## 1. Overview

The system covers student check-in, lecturer-side session management, and basic attendance analysis.

Login currently uses demo accounts. The signed-in role and user snapshot are stored in browser `sessionStorage`.

## 2. Live Website

Login URL: `https://student-attendance-tracking-analyti.vercel.app/login`

## 3. Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` after the dev server starts.

## 4. Login

Student demo account:

- `s001 / student123`

Lecturer demo account:

- `lecturer01 / teach123`

After login, users are redirected to the page for their role.

## 5. Student Features

1. Enter a session code and check in.
2. View personal attendance rate, trend, and attendance split.
3. See a warning when attendance drops below the configured threshold.

## 6. Lecturer Features

1. Create a session and generate a session code.
2. Load attendance records by session code.
3. Close one active session.
4. Reset records for the current session while keeping the session open.
5. Clear all session and attendance data.
6. Run attendance analysis and view charts.
7. Email students with low attendance or copy a reminder message.

## 7. Threshold Rule

The project uses `40%` as the minimum low-attendance warning threshold.

The lecturer page starts at `40%`, and the allowed input range is `40-100`.

## 8. Data Notes

Demo account data is stored in the codebase for academic testing and presentation.

Session and attendance data are stored in Firebase Firestore. Firestore access uses anonymous sign-in, and the rules are defined in `firestore.rules`.

The Firebase values used by the client are public web app configuration values. For local setup, put them in `.env.local` instead of editing source files.

## 9. Main Structure

- `app/`: pages and routes
- `app/components/`: shared UI components
- `src/lib/`: Firebase setup, demo accounts, and shared constants
- `docs/`: project documents

## 10. Firestore Rules

Rules file: `firestore.rules`

Firebase config: `firebase.json`

Deploy commands:

```bash
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
```
