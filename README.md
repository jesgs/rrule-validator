# RRULE Validator (offline)

A simple, one-page web tool to **validate RFC 5545 RRULE strings** (RRULE-only) and **preview the next N occurrences**.

Designed to run **100% offline** (no network, no server required). You can open `index.html` directly in your browser.

## Features

- Validate RRULE strings (shows parsing errors)
- Normalizes lowercase keys/values to uppercase for convenience
- Preview next N occurrences using a local-time `DTSTART`
- Offline-friendly: vendored JS dependencies in `vendor/`

## Usage (local)

1. Clone the repo:
   ```bash
   git clone https://github.com/jesgs/rrule-validator.git
   cd rrule-validator
   ```
2. Open `index.html` in your browser (double-click it or “Open File…”).

## Project structure

- `index.html` — UI
- `app.js` — validation + preview logic
- `style.css` — styling
- `vendor/` — vendored dependencies (offline)
- `images/` — images/icons used by the page

## Attribution

Calendar icons:  
https://www.flaticon.com/free-icons/calendar — Calendar icons created by Rasel Hossin - Flaticon

## License

This project is dedicated to the public domain under the terms of the **Unlicense**. See [LICENSE](./LICENSE).