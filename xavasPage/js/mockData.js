/**
 * MOCK DATA — operação temporária até integração com Google Sheets.
 * Simula os dados que virão das abas da planilha.
 */

const MOCK_PROTOCOL = [
  { id: 1, name: "Morning PT", tag: "health", day: "Monday", start: "06:00", end: "07:00" },
  { id: 2, name: "Tactical Briefing", tag: "work", day: "Monday", start: "08:00", end: "09:00" },
  { id: 3, name: "Code Review", tag: "unilavras", day: "Wednesday", start: "10:00" },
  { id: 4, name: "Gear Maintenance", tag: "personal", day: "Thursday", start: "18:00", end: "19:00" },
  { id: 5, name: "Night Watch", tag: "personal", day: "Saturday", start: "22:00" }
];

const MOCK_TASKS = [
  { id: 1, name: "Submit TPS report", tag: "freelance", date: "2026-07-02", status: "To Do" },
  { id: 2, name: "Update squad roster", tag: "unilavras", date: "2026-07-03", status: "In Progress" },
  { id: 3, name: "Patrol route planning", tag: "personal", date: "2026-07-06", status: "Completed" },
  { id: 4, name: "Resupply inventory", tag: "personal", date: "2026-07-01", status: "Forgotten" }
];

const MOCK_CONSUMABLES = [
  { id: 1, name: "Protein Powder", brand: "Growth", qty: "900g", opened: "2026-06-15", predictedEnd: "2026-07-05" },
  { id: 2, name: "Ammo 9mm", brand: "Federal", qty: "50 units", opened: "2026-06-01", predictedEnd: "2026-07-02" },
  { id: 3, name: "Coffee Beans", brand: "Orfeu", qty: "250g", opened: "2026-06-20", predictedEnd: "2026-07-15" }
];

const MOCK_GAMES = [
  { id: 1, name: "Elden Ring", cover: "https://picsum.photos/id/1015/200/300", year: 2022, platform: "PC", emulator: false, score: 95, status: "In Progress" },
  { id: 2, name: "Zelda: Tears of Kingdom", cover: "https://picsum.photos/id/1043/200/300", year: 2023, platform: "Switch", emulator: false, score: 97, status: "To Play" },
  { id: 3, name: "Hollow Knight", cover: "https://picsum.photos/id/106/200/300", year: 2017, platform: "PC", emulator: false, score: 90, status: "Completed" }
];

const MOCK_SHOWS = [
  { id: 1, name: "Breaking Bad", cover: "https://picsum.photos/id/1005/200/300", year: 2008, language: "English", score: 98, type: "Series", status: "Completed" },
  { id: 2, name: "Attack on Titan", cover: "https://picsum.photos/id/1012/200/300", year: 2013, language: "Japanese", score: 93, type: "Anime", status: "In Progress" },
  { id: 3, name: "Dune (Book)", cover: "https://picsum.photos/id/102/200/300", year: 1965, language: "English", score: 95, type: "Book", status: "To Watch/Read" }
];