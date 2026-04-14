# Dutch–English Phrase Game

A small browser game to practice Dutch phrases with multiple-choice answers, a timer, and session results.

## Run locally

From the project folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## How to play

- Enter your name.
- Pick a category.
- Start a round (each round uses about 7–8 phrases from the selected category).
- Choose the correct English translation before time runs out.

## Categories / data

Phrases live in `data.json` under:

- `categories.simple_phrases`
- `categories.interview_phrases`
- `categories.professional_phrases`

## Features

- **Timer + progress bar**
- **Hear phrase** (Dutch text-to-speech)
- **Pause / Stop**
- **Results dashboard** (last game result + player summary + leaderboard)
- **Leaderboard filter by category**
- **Local persistence** via `localStorage` (results and in-progress session data)
