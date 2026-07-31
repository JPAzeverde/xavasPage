# XAVAS HUD 🖥️

**XAVAS HUD** is a personal management system built with a tactical "Heads-Up Display" (HUD) inspired interface and a monochrome palette[cite: 1, 2]. The project serves as a centralized command center to organize routines, tasks, media consumption, and supply inventory, operating in real-time through Firebase integration.

## ⚙️ Technologies Used

*   **Front-end:** HTML5, CSS3 (Vanilla with CSS variables and responsive design), and JavaScript (ES6 Modules)[cite: 1, 2, 3].
*   **Typography:** Stylized *Cascadia Code* font to reinforce the tactical design[cite: 2].
*   **Back-end (BaaS):** Firebase (Firestore Database for real-time data and Firebase Authentication for security).
*   **External APIs:** 
    *   **Open-Meteo API:** For the Meteorological Radar[cite: 3].
    *   **rss2json API:** To intercept global signals (Global Intel Feed)[cite: 3].

## 🚀 Features (System Modules)

### 1. Command Center (Main Dashboard)
The main dashboard centralizes the system's vital information:
*   **Meteorological Radar:** Fetches weather forecasts based on geographical coordinates using the Open-Meteo API, allowing multiple cities to be saved locally in the browser[cite: 3].
*   **Global Intel Feed:** Intercepts and displays the latest news (RSS feeds) from major intelligence sources in Brazil and worldwide (G1, UOL, BBC, NYT, etc.)[cite: 3].
*   Real-time overview of Active Operations, today's Protocol Directives, Media Execution, and Supplies[cite: 1, 3].

### 2. Security Gateway (Authentication)
*   Restricted login system ("Restricted Access") designed to authorize only registered operatives[cite: 4].
*   Route protection (`guard.js`) that redirects unauthorized access attempts back to the gateway[cite: 3].

### 3. Protocol Directive (Routine Matrix)
*   7-day tactical matrix (Monday to Sunday) for routine organization[cite: 4].
*   Time-based visual rendering with dynamic height calculation for task blocks[cite: 3].
*   Real-time visual indicator (red line) highlighting the current time[cite: 3].

### 4. Tactical Operations (Task Kanban)
*   Objective management using a classic Kanban board (Pending, Active, Completed, Aborted)[cite: 4].
*   Drag-and-Drop support synchronized directly with the Firestore database[cite: 3].
*   Visual tagging system ("Unilavras", "Solargun", "Personal") and deadline tracking (T-Zero)[cite: 3, 4].

### 5. Media Execution (Entertainment)
*   Customizable Media Arrays (e.g., Anime, Games, Series)[cite: 4].
*   Dynamic injection of custom fields (Text String, Numeric Value, Dropdown, Checkbox) when creating arrays[cite: 3, 4].
*   Management via a Drag-and-Drop system[cite: 3].

### 6. Logistics & Inventory (Supplies)
*   Inventory control divided into three operational states: *Stock*, *Active*, and *Depleted*[cite: 4].
*   **Predictive System:** The system calculates the average lifespan of an item based on usage history and projects the estimated depletion date[cite: 3].

## 🛠️ Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/xavas-hud.git](https://github.com/your-username/xavas-hud.git)
