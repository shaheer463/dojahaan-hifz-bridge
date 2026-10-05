# Changelog

All notable changes to DoJahaan Hifz Bridge are listed here, newest first.
Versions follow [Semantic Versioning](https://semver.org): MAJOR.MINOR.PATCH.

- **PATCH** (1.0.1): fixes, like a typo or a wrong word meaning.
- **MINOR** (1.1.0): new features that keep everyone's saved progress, like surah stories or more words.
- **MAJOR** (2.0.0): big changes that could reset or move saved progress, or new surah ranges.

## [1.1.1] - 2026-10-05

### Changed
- Connected the app to the DoJahaan Google Sheet collector.
- Events now leave the phone only after the Sheet confirms it received them, so a broken or misconfigured link loses nothing; they wait and retry.
- When sharing is on, the home screen footer shows how many events are waiting to send and whether the last try failed. That makes it easy to check the setup.

## [1.1.0] - 2026-10-05

### Added
- **Anonymous usage events** for the feedback and insights loop: app opens, every "I got it" / "Needed help" tap, practice-list changes, recite rounds, puzzle and word-quiz results (including which wrong word was picked). Events are kept on the phone while offline and sent in batches when online.
- **Parent opt-in card** on the home screen, behind a simple parent check. Nothing is recorded unless a parent says yes. Sharing can be turned off from the link at the bottom of the home screen, which also deletes any unsent events.
- `tools/google-apps-script.gs`: a collector that writes events to a Google Sheet you own.
- `docs/FEEDBACK-SETUP.md`: setup steps, a list of every event, and useful pivot tables.

### Notes
- No names, recordings, typed text or location are collected. Each device gets a random anonymous ID.
- Events are only sent once `ANALYTICS_URL` in `analytics.js` is set.

## [1.0.0] - 2026-10-04

First release.

### Memorize Surahs
- Surahs 99–114 in Indo-Pak script, with Mishary Alafasy's recitation split by ayah.
- **Listen & follow:** each word lights up as it is recited. Each ayah can repeat 1×, 3× or 5×, and the English meaning can be shown or hidden.
- **Your turn:** the ayah is hidden; the child recites, then checks. Hint plays the first two words.
- **Practice list:** ayahs marked "Needed help" stay on a per-surah list until recited correctly. The star unlocks only when the whole surah has been recited and the list is empty.
- **Ayah puzzle:** tap the ayahs in order, in chunks of up to 5.

### Learn Words
- 81 key words, ordered by how often they appear in these surahs, in 9 levels of 9.
- Each word has a picture, Alafasy's pronunciation, an English meaning and example sentence read aloud, and the ayah it comes from.
- **Listen & pick** quiz for each level.

### App
- DoJahaan Bridge logo and branding.
- Installable (Add to Home Screen) and works fully offline after the first visit.
- Progress (stars, practice lists) saved on each device.
- American English spelling.
