# Shut Up Already!

This is a Chromium extension that I built in 2015 to automatically mute all browser tabs by default.

It was more useful back when loud, obnoxious, autoplaying videos and ads were all the rage.
These days most companies regained their sanity and the videos they're autoplaying are muted
but the extension is still quite helpful in making sure no unnecessary noises are coming from
your browser until you explicitly expect them.

## Changelog

- 2.3.1:
  - Fix the logic deciding when to mute tabs, including when to evaluate whitelists/blacklists and what "keep muted state"
    means. This should fix the issue where tabs would not be muted or unmuted correctly compared to the previous version
    of the extension.
- 2.3.0:
  - Fix context menu actions
  - There is a major change in the behaviour of the "Keep muted state of the opening tab" flag. Previously due to a
    mistake two separate features have been merged together - keeping muted state and muting all tabs by default.
    This has now been fixed and you can set the two settings separately. Existing users will have them both enabled if
    they had the feature enabled before.
- 2.2.0: Rewrite service worker to prevent issues with MV3 being garbage standard that keeps glitching and killing things in the background
- 2.1.0: Corporate ad-driven garbage bullshit requirement update (converted the extension from manifest v2 to v3)
- 2.0.1: Update privacy practices
- 2.0: Removed popup, added options page and context menu instead. Clicking on mute icon will now toggle mute status.
- 1.2: Added popup with multiple options and settings
- 1.0: Initial release

## Links

- [Chrome Web Store](https://chromewebstore.google.com/detail/shut-up-already/iloigdigjemgpoejkbcbehdjbihelhkk)
