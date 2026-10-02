# IntonixUB

Create a modern, ultra-clean unblocked games web application titled "Intonix Games" designed to bypass network restrictions cleanly while delivering a sleek, distraction-free user experience. The UI should feature a minimalist aesthetic—utilizing a dark, slate-gray/deep-navy color palette with subtle glowing accent colors (such as electric blue or neon violet), clean typography (like Inter or Plus Jakarta Sans), smooth micro-interactions, responsive grid layouts, and glassmorphism UI elements.

The website must consist of the following core architecture, features, and design requirements:

1. Navigation & Global Layout

 * Header: Minimalist top bar featuring the "Intonix Games" text logo with a glowing neon accent, an integrated global search bar with live auto-complete, a quick-access "Panic Button" icon (default keybind: Esc to instantly redirect to Google Classroom or Canvas), and navigation links for Home, Games, Proxy, and Settings.

 * Footer: Clean, simple links for Privacy Policy, Terms of Service, DMCA / Take Down Request, and an embedded Discord/community widget.

2. Home Page

 * Hero Section: Dynamic visual banner showcasing "Featured Game of the Week" with a prominent "Play Now" call-to-action button, background preview video or dynamic animated canvas, and a quick stats bar (e.g., total games, active players).

 * Quick Access Categories: Horizontally scrollable tag pills for quick filtering (e.g., Popular, Action, Retro, Multiplayer, 3D, Strategy).

 * Recently Played & Favorites: Persisted sections using LocalStorage that show the user's recent and pinned games.

3. Games Page & Player Interface

 * Game Grid: Responsive flex/grid layout displaying game cards with hover animations (scale-up effect, smooth blur-in preview, and title overlay). Each card should display a thumbnail, game title, category tag, and a favorite (heart) toggle.

 * Game Player View (/play/:id):

   * Clean iframe wrapper designed to host embeddable games seamlessly.

   * Control bar above/below the iframe including: Fullscreen toggle, Reload iframe button, Favorite button, Light switch (dims surrounding background elements), and a "Open in About:Blank" tab button for stealth browsing.

   * Related games section placed below the main player frame.

4. Built-in Web Proxy Page (/proxy)

 * Proxy Interface: A clean, search-engine-style search bar where users can enter custom URLs or web searches.

 * Pre-configured Quick Launch Hub: Quick-access cards for popular web apps (e.g., Discord, YouTube, Reddit, Wikipedia) routed through an embedded proxy frame/URL rewriting service placeholder.

 * Status Bar: Visual indicator showing current proxy node connection status (e.g., "Node: US-East | Ping: 24ms | Status: Connected").

5. Advanced Settings Page (/settings)

 * Tab Cloaking / Stealth Mode:

   * Options to change the browser tab's Title and Favicon instantly (e.g., preset templates for Google Drive, Canvas, Google Classroom, PowerSchool, or custom user-uploaded icons and titles).

 * Custom Appearance & Themes:

   * Theme Switcher: Toggle between Intonix Dark (default slate/neon), Midnight OLED (true black), Cyberpunk (pink/cyan accent), Nord, Catppuccin, and Light Mode.

   * Accent Color Customizer: Color picker to select custom primary accent colors for buttons, glows, and active states.

   * Custom Backgrounds: Toggle between solid color, subtle CSS gradient mesh, animated particles, or custom image URL backdrop.

 * Keybinds & Emergency Redirect:

   * Configurable Panic Key (allows binding any key to trigger an immediate, stealthy tab redirect).

   * URL redirect selector (choose where the panic button sends the tab).

 * Data & Storage Management:

   * Buttons to export/import save data, clear local cache, and reset custom preferences.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ccac2a68-60d5-4e40-b202-ae5eef60175a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
