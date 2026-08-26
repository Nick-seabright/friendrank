# FriendRank

A lighthearted point-based leaderboard for a friend group (4-8 people). Log points about
each other for real-life stuff — memes, showing up, flaking, trash talk — and they only
count once the other person confirms. Built from the MVP scope: auth, groups with invite
codes, preset-based point logging, accept/dispute confirmation, a live + all-time
leaderboard, and a chronological feed.

## Structure

- `server/` — Express + Prisma (SQLite) + JWT auth API
- `app/` — Expo (React Native) client, TypeScript

## Running the backend

```bash
cd server
npm install        # first time only
npx prisma migrate deploy   # first time only, creates dev.db
npx ts-node prisma/seed.ts  # first time only, seeds the preset list
npm run dev
```

The API listens on `http://0.0.0.0:4000`. It uses a local SQLite file at
`server/prisma/dev.db` — no external database needed.

## Running the app

```bash
cd app
npm install     # first time only
npm start
```

This opens the Expo dev tools. Scan the QR code with **Expo Go** (iOS/Android) on a phone
on the same Wi-Fi network as your computer — the app auto-detects your computer's LAN IP
from the Expo dev server, so no config is needed for the API URL. Make sure the backend
(above) is running first.

You can also run `npm run web` inside `app/` to preview in a browser, though a couple of
native-only bits (secure token storage, push notifications) fall back to browser-friendly
substitutes there instead of their real native versions.

## Push notifications

The confirmation flow ("Nick gave you -3, accept or dispute?") is wired to send a push
notification to the recipient when points are logged. Two things to know:

1. **Expo Go can't receive remote push** as of SDK 53+ (an Expo/platform policy change,
   not a bug here). To actually test push delivery, you need a **development build**:
   ```bash
   npx eas login
   npx eas build --profile development --platform android   # or ios
   ```
   Install that build on your phone instead of using Expo Go.
2. Without a dev build, the app still works fully — pending confirmations show up in the
   **Confirmations** tab (with a badge count) whenever you open the app or pull to
   refresh. Push is a nice-to-have on top of that, not a requirement for the loop to work.

## What's built (MVP)

- Signup/login (email + password, JWT)
- Create a group or join one via a 6-character invite code (soft warning past 8 members)
- Log a point about another member: pick friend → pick preset → optional note → confirm
- Positive presets auto-accept after 24h if ignored; negative presets never auto-accept
  and expire after 7 days if nobody responds
- Accept/dispute flow — points don't hit the leaderboard until accepted
- Leaderboard with a live period score (manually resettable by the group creator) and a
  permanent all-time score, plus a contested-points count per person
- Chronological feed of accepted + disputed points
- A point-pop animation on log and on accept

## Deferred to v2 (per the original brief)

Recap cards, badges/titles, automatic weekly/monthly leaderboard resets (the schema
already has a `leaderboardPeriod` field on `Group` for this — only the reset trigger is
manual for now), and emoji reactions on feed entries.
