export type Game = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  blurb: string;
  /** Embeddable URL. Empty means you can paste your own host in the player. */
  embedUrl: string;
  art: string;
  plays: number;
};

const g = (
  id: string,
  title: string,
  category: string,
  blurb: string,
  embedUrl: string,
  art: string,
  plays: number,
  tags: string[] = [],
): Game => ({ id, title, category, blurb, embedUrl, art, plays, tags: [category, ...tags] });

export const CATEGORIES = [
  "Popular",
  "Action",
  "Retro",
  "Multiplayer",
  "3D",
  "Strategy",
  "Puzzle",
  "Sports",
] as const;

export const GAMES: Game[] = [
  g(
    "2048",
    "2048",
    "Puzzle",
    "Slide the tiles, chase the big number.",
    "https://play2048.co/",
    "linear-gradient(135deg,#f6b17a,#e2703a)",
    184320,
    ["Popular", "Retro"],
  ),
  g(
    "hextris",
    "Hextris",
    "Puzzle",
    "Tetris on a spinning hexagon.",
    "https://hextris.io/",
    "linear-gradient(135deg,#2ec4b6,#1b6ca8)",
    98214,
    ["Popular", "Action"],
  ),
  g(
    "untrusted",
    "Untrusted",
    "Strategy",
    "Escape the machine by rewriting its code.",
    "https://alexnisnevich.github.io/untrusted/",
    "linear-gradient(135deg,#3ddc84,#0b3d2e)",
    41022,
    ["Retro"],
  ),
  g(
    "cube-composer",
    "Cube Composer",
    "Puzzle",
    "Functional programming as a stacking puzzle.",
    "https://david-peter.de/cube-composer/",
    "linear-gradient(135deg,#7f7fd5,#3b3b98)",
    27331,
    ["Strategy"],
  ),
  g(
    "neon-drift",
    "Neon Drift",
    "3D",
    "Pure-speed tunnel racer with synth trails.",
    "",
    "linear-gradient(135deg,#00e5ff,#7a00ff)",
    152990,
    ["Popular", "Action"],
  ),
  g(
    "pixel-siege",
    "Pixel Siege",
    "Strategy",
    "Tower defense with a 16-bit heart.",
    "",
    "linear-gradient(135deg,#ffd166,#ef476f)",
    88120,
    ["Retro"],
  ),
  g(
    "shell-shooters",
    "Shell Shooters",
    "Multiplayer",
    "Tanks, terrain, physics, chaos.",
    "",
    "linear-gradient(135deg,#f72585,#3a0ca3)",
    204551,
    ["Popular", "Action"],
  ),
  g(
    "block-forge",
    "Block Forge",
    "3D",
    "Build anything in an infinite voxel field.",
    "",
    "linear-gradient(135deg,#43aa8b,#277da1)",
    311204,
    ["Popular", "Multiplayer"],
  ),
  g(
    "retro-kart",
    "Retro Kart",
    "Sports",
    "Split-screen kart racing, no downloads.",
    "",
    "linear-gradient(135deg,#ff9f1c,#e71d36)",
    76540,
    ["Retro", "Multiplayer"],
  ),
  g(
    "cell-swarm",
    "Cell Swarm",
    "Multiplayer",
    "Eat, grow, dominate the petri dish.",
    "",
    "linear-gradient(135deg,#90f7ec,#32ccbc)",
    142880,
    ["Popular"],
  ),
  g(
    "vector-vault",
    "Vector Vault",
    "Action",
    "Wireframe platforming with pinpoint timing.",
    "",
    "linear-gradient(135deg,#c1fba4,#4361ee)",
    35410,
    ["Retro"],
  ),
  g(
    "hoop-alley",
    "Hoop Alley",
    "Sports",
    "Two-button basketball, endless streaks.",
    "",
    "linear-gradient(135deg,#f4a261,#264653)",
    45890,
    [],
  ),
  g(
    "mind-maze",
    "Mind Maze",
    "Puzzle",
    "Procedural labyrinths that fight back.",
    "",
    "linear-gradient(135deg,#a8dadc,#457b9d)",
    29800,
    ["Strategy"],
  ),
  g(
    "orbit-run",
    "Orbit Run",
    "Action",
    "Gravity-slinging endless runner.",
    "",
    "linear-gradient(135deg,#b5179e,#480ca8)",
    61240,
    ["3D"],
  ),
  g(
    "farm-tactics",
    "Farm Tactics",
    "Strategy",
    "Grid-based crop economy sim.",
    "",
    "linear-gradient(135deg,#9ef01a,#38b000)",
    22140,
    [],
  ),
  g(
    "arcade-brawl",
    "Arcade Brawl",
    "Multiplayer",
    "Local 4-player platform fighting.",
    "",
    "linear-gradient(135deg,#ff477e,#ff8fab)",
    99870,
    ["Action", "Retro"],
  ),
];

export const FEATURED_ID = "neon-drift";

export const getGame = (id: string) => GAMES.find((x) => x.id === id);

export const relatedGames = (game: Game, count = 6) =>
  GAMES.filter((x) => x.id !== game.id)
    .sort((a, b) => {
      const overlap = (x: Game) => x.tags.filter((t) => game.tags.includes(t)).length;
      return overlap(b) - overlap(a) || b.plays - a.plays;
    })
    .slice(0, count);
