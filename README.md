# TrackStar

TrackStar is a local-first running cadence coach that measures how the runner is moving and adapts an offline soundtrack to guide them toward the workout target.

## Run the hackathon MVP

Requirements: Node 22.13 or newer, `pnpm`, and a phone with an Expo development build.

```bash
pnpm install
pnpm start
```

Use a physical phone for real cadence detection; simulators cannot reproduce running motion. The app defaults to Demo Mode so the entire feedback loop remains repeatable on stage.

## Spotify sign-in setup

TrackStar uses Spotify's Authorization Code with PKCE flow. No client secret belongs in the app.

1. The included public demo client ID works for users allowlisted on that Spotify app. To use your own app, create one in the [Spotify developer dashboard](https://developer.spotify.com/dashboard), copy `.env.example` to `.env`, and replace `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`.
2. For native builds, add `trackstar-spotify://callback` to the Spotify app's redirect URI allowlist. Expo selects that callback automatically.
3. For local web development, open the app at `http://127.0.0.1:8081` and allowlist `http://127.0.0.1:8081/callback`; Spotify does not accept `localhost` redirect URIs. For a deployed web app, allowlist its exact HTTPS `/callback` URL and set `EXPO_PUBLIC_SPOTIFY_REDIRECT_URI` to that URL.
4. Create/rebuild an Expo development build after adding the native URL scheme, then start the app.

Spotify OAuth cannot be tested inside Expo Go because Expo Go cannot own TrackStar's callback scheme. On Android, use the HTTPS web build in Chrome or install a development build; scanning the project into Expo Go will keep the rest of the demo working but Spotify sign-in is intentionally disabled.

Spotify development-mode apps currently require the owner to have Premium and allow up to five allowlisted users. Add each tester in the Spotify dashboard. After authorization, TrackStar stores native refresh tokens in SecureStore, fetches the user's profile, top tracks, and saved tracks, and uses that personalized catalog for soundtrack selections. It requests `user-read-playback-state` and `user-modify-playback-state` so the run controls can operate an available Spotify Connect device. Web builds use browser storage and should be served only over HTTPS.

Spotify recordings are not downloaded or streamed by TrackStar. With Spotify connected, the run controls start, pause, and switch tracks on an available Spotify app, Web Player, or Spotify Connect device. Open Spotify on at least one device before starting a run. Spotify playback control requires Premium. Without Spotify, TrackStar uses its original bundled cadence loops.

Useful commands:

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm exec expo export --platform android
```

## Android development APK

This project includes `expo-dev-client` and an EAS `development` profile that produces an installable APK. Sign in to Expo and launch the cloud build with:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile development
```

After installing the APK, run `pnpm start` and open the TrackStar development client rather than Expo Go. The development client owns `trackstar-spotify://callback`, which must be registered exactly in the Spotify developer dashboard.

## 60-second demo script

1. Optionally sign in with Spotify, then tap **Build my run**.
2. Keep **Hackathon Demo Mode** enabled and preview the workout.
3. Choose **Demo · Guaranteed sequence**, then start the run.
4. Let automatic cadence move from warm-up to tempo, or tap **Slow**, **Target**, and **Fast**.
5. Point out Actual SPM, Target, Beat Match, and the soundtrack transition.
6. Let the 46-second run finish and show the cadence/target/music overlay on the summary.

For a physical demonstration, choose **Real sensor**, grant Motion permission, keep the phone secured close to the body, and jog in place. If permission or hardware is unavailable, TrackStar automatically falls back to simulation.

## What is included

- Expo Router and strict TypeScript on Expo SDK 57
- Editable multi-interval workout builder
- Direct-time, half-time, and double-time tempo normalization
- Gradual ±6 SPM coaching nudges with anti-jitter switching rules
- Deterministic simulated cadence and a 20 Hz accelerometer provider
- Offline generated audio loops at 145, 164, 172, and 178 BPM
- Pause, skip, early end, haptic interval transitions, and sensor cleanup
- Persisted profile, workout, cadence source, and recent summaries
- Spotify PKCE sign-in with profile, library sync, and Spotify Connect playback control
- Beat Match, time-in-target, consistency, step estimate, and timeline analytics
- Unit coverage for cadence, matching, coaching, analytics, and session timing

Spotify remains optional. Without an account, network, or client ID, the complete demonstration falls back to the built-in Malcolm Todd example catalog and original cadence loops.

## Architecture

Pure logic lives in `src/domain`; platform APIs are isolated in `src/providers`; persisted state lives in `src/stores`; and route files focus on presentation. The run screen connects providers to `RunSessionEngine` through `useRunSession`, keeping sensor, playback, and session lifecycle code outside the screen component.

Bundled loops and launcher artwork are original procedural assets. Rebuild them with:

```bash
node scripts/generate-audio.mjs
node scripts/generate-brand-assets.mjs
```

TrackStar provides fitness estimates and is not a medical device.
