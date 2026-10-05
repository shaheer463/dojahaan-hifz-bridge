# DoJahaan Hifz Bridge

A kids' app (ages 5–10) for keeping hifz practice alive between Quran lessons. It covers Surahs 99–114 (Juz ʿAmma) in Indo-Pak script.

Hifz Bridge is part of DoJahaan. It supports your Quran learning but does not replace a Quran teacher.

## What it does

**Memorize Surahs.** Each surah has three steps:
1. **Listen & follow:** Mishary Alafasy recites ayah by ayah while each word lights up.
2. **Your turn:** recite from memory, then check. Ayahs marked "Needed help" go on a practice list that stays until they are recited correctly. The star unlocks only when the list is empty.
3. **Ayah puzzle:** tap the ayahs in order.

**Learn Words.** 81 key words, ordered from most to least frequent in these surahs, in 9 levels. Each word has a picture, Alafasy's pronunciation, an English meaning, a simple example sentence and the ayah it comes from. A "Listen & pick" quiz follows each level.

## Works offline

This is a Progressive Web App. Open it once while online, then use **Add to Home Screen**. After that it opens from its own icon and works with no internet. Progress (stars and practice lists) is saved on each device.

## Files

| Path | Contents |
|---|---|
| `index.html` | The app |
| `data.js` | Surah text, word timings, the 81 words and their pictures |
| `icons.js` | Small interface pictures |
| `a/` | Ayah recitation clips (`SSS_AAA.mp3`) |
| `w/` | Word pronunciation clips |
| `fonts/` | Indo-Pak Quran font and Baloo 2 |
| `icons/` | App icons |
| `sw.js` | Offline support. It saves every file on first visit. |
| `manifest.webmanifest` | Lets phones install the app |

There's no build step and no server code. Any static host works, such as Cloudflare Pages or GitHub Pages.

To try it locally, run `python3 -m http.server` in this folder and open http://localhost:8000. Offline support needs http, not a double-clicked file.

## Versioning

The current version is in [`VERSION`](VERSION) and shows in the app's footer. Every release is listed in [`CHANGELOG.md`](CHANGELOG.md) and tagged in git (`v1.0.0`, `v1.1.0`, …).

To release a new version:

1. Make your changes.
2. Run `scripts/bump-version.sh 1.1.0` with the new number. This updates `VERSION`, the app footer and the offline cache name. Phones only download updated files when the cache name changes.
3. Add a section for the new version at the top of `CHANGELOG.md`.
4. Commit, then tag: `git tag v1.1.0 && git push --tags`.

Version numbers follow MAJOR.MINOR.PATCH. See the top of the changelog for which part to raise.

## Credits

- Indo-Pak Quran text and font: QuranWBW.com, by Ayman Siddiqui & R. Siddiqua, used with credit as requested.
- Recitation: Mishary Rashid Alafasy.
- Word timings: [quran-align](https://github.com/cpfair/quran-align) by Collin Fair, CC BY 4.0.
- Word frequency: Quranic Arabic Corpus morphology data.
- Pictures: Microsoft Fluent Emoji (MIT).
- Fonts: Baloo 2 (SIL Open Font License).
- Ayah meanings: Saheeh International.
