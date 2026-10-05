# Tab search and bookmarklets

## Build
- Add a compact Chrome-style tab-search menu at the left of the tab strip.
- Let users filter open tabs, switch to them, close them, and reopen recently closed tabs.
- Recognize `javascript:` entries in the omnibox and run the bookmarklet inside the active page without navigating away.
- Show a clear message when a page cannot accept a bookmarklet.

## Technical details
- Keep recent closed-tab history in the current browser session only.
- Execute bookmarklet text against the active Ultraviolet frame; do not send it to the proxy endpoint or store it.
- Preserve the compact tab design and existing browser controls.
