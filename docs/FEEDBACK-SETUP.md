# Usage events setup

Hifz Bridge can send anonymous practice events to a Google Sheet you own. It sends nothing until both of these are true:

1. You've pasted your collector URL into `analytics.js`.
2. A parent on that device has tapped **Yes, share** on the home screen (behind a simple parent check).

## One-time setup (about 10 minutes)

Do this signed in to the Google account that should own the data. A dedicated DoJahaan account is best.

1. **Create the Sheet.** Go to sheets.new and name it `Hifz Bridge – events`.
2. **Add the collector.** In the Sheet, open **Extensions → Apps Script**. Delete what's there, paste in everything from `tools/google-apps-script.gs`, and click **Save**.
3. **Deploy it.** Click **Deploy → New deployment**. Click the gear and choose **Web app**, then set:
   - Execute as: **Me**
   - Who has access: **Anyone**

   Click **Deploy** and approve the permissions. Google warns that the app is unverified because you wrote it yourself; choose **Advanced → Go to project**.
4. **Copy the Web app URL.** It looks like `https://script.google.com/macros/s/…/exec`. Open it in a browser and you should see "Hifz Bridge collector is running."
5. **Connect the app.** Paste the URL into `ANALYTICS_URL` at the top of `analytics.js`, raise the version (`scripts/bump-version.sh 1.1.1`), commit and push.

Rows appear in the `events` tab within a few seconds of practice, or the next time an offline phone comes online.

## What's recorded

Every row has: time, event name, an anonymous random device ID, a session ID, the app version, `app` or `browser` mode, and `ios`, `android` or `desktop`.

| Event | Extra fields | What it tells you |
|---|---|---|
| `app_open` | | Active devices and practice days per device (retention) |
| `consent_yes` | | When a family opted in |
| `app_installed` | | Home-screen installs |
| `listen_done` | surah | Listened to a whole surah |
| `ayah_result` | surah, ayah, correct, practice | Every "I got it" / "Needed help" tap |
| `needed_help` | surah, ayah | An ayah newly added to the practice list |
| `practice_cleared` | surah, ayah | A practice-list ayah recited correctly |
| `recite_round` | surah, score, total, practice, weak_left, stars | End of a Your turn round |
| `recite_star` | surah | Surah fully cleared for the first time |
| `puzzle_done` | surah, slips, stars | Ayah puzzle finished |
| `cards_done` | level | Word cards finished |
| `quiz_answer` | level, word, correct, type, picked | Each quiz answer; `picked` shows which wrong word was chosen |
| `quiz_done` | level, score, total, stars | End of a quiz |

Nothing else is collected: no names, no recordings, no typed text, no location.

## Insight tabs (built for you)

The same script also builds five summary tabs from the raw events, so you don't need pivot tables.

1. In Apps Script, replace the code with the latest `tools/google-apps-script.gs` and click **Save**. There's no need to redeploy; the web app keeps working.
2. Reload the Google Sheet. A **Hifz Bridge** menu appears next to Help.
3. Click **Hifz Bridge → Refresh insights**. The first time, approve the permissions: your account, then **Advanced → Go to project**.
4. Optional: click **Hifz Bridge → Refresh every morning** to update the tabs daily around 6am.

| Tab | Shows |
|---|---|
| **Summary** | Families opted in, weekly active families, practice days per device, how often ayahs are recited from memory, practice ayahs cleared, stars, quiz accuracy |
| **Hardest ayahs** | Every ayah tried, ranked by how often it needed help, with the help rate and how many families struggled with it |
| **Hardest words** | Words ranked by lowest quiz accuracy, and which word they're most often confused with |
| **Devices** | One row per anonymous device: first and last seen, active days, active days in the last week, ayahs recited, stars, version |
| **Daily** | Active devices, ayahs recited, help taps and quiz answers per day |

The tabs are rebuilt on each refresh, so don't type notes into them. Keep notes in a separate tab.

## Checking it works

1. Open the app, tap **Yes, share** on the parent card and answer the sum.
2. Do anything, such as one ayah in "Your turn", then go back to the home screen.
3. Within a few seconds a row should appear in the `events` tab.

The footer on the home screen helps:
- "(3 waiting to send)" means events are still on the phone, for example because it's offline.
- "last try failed" means the Sheet didn't confirm. Check that the deployment's **Who has access** is **Anyone**, that you redeployed with **New version** after any script edit, and that the link in `analytics.js` matches **Deploy → Manage deployments**. Nothing is lost while you fix it.

## Turning it off

- **A parent can switch sharing off** from the link at the bottom of the home screen. That also deletes any events waiting on that phone.
- **To stop everything,** empty `ANALYTICS_URL` and release a new version, or archive the Apps Script deployment.
