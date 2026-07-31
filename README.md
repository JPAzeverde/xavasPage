# XAVAS HUD 

**XAVAS HUD** is a personal management system built with a tactical "Heads-Up Display" (HUD) inspired interface and a monochrome palette. The project serves as a centralized command center to organize routines, tasks, media consumption, and supply inventory, operating in real-time through Firebase integration.

##  Technologies Used

*   **Front-end:** HTML5, CSS3 (Vanilla with CSS variables and responsive design), and JavaScript (ES6 Modules).
*   **Typography:** Stylized *Cascadia Code* font to reinforce the tactical design.
*   **Back-end (BaaS):** Firebase (Firestore Database for real-time data and Firebase Authentication for security).
*   **External APIs:** 
    *   **Open-Meteo API:** For the Meteorological Radar.
    *   **rss2json API:** To intercept global signals (Global Intel Feed).

##  Features (System Modules)

### 1. Command Center (Main Dashboard)
The main dashboard centralizes the system's vital information:
*   **Meteorological Radar:** Fetches weather forecasts based on geographical coordinates using the Open-Meteo API, allowing multiple cities to be saved locally in the browser.
*   **Global Intel Feed:** Intercepts and displays the latest news (RSS feeds) from major intelligence sources in Brazil and worldwide (G1, UOL, BBC, NYT, etc.).
*   Real-time overview of Active Operations, today's Protocol Directives, Media Execution, and Supplies.

### 2. Security Gateway (Authentication)
*   Restricted login system ("Restricted Access") designed to authorize only registered operatives.
*   Route protection (`guard.js`) that redirects unauthorized access attempts back to the gateway.

### 3. Protocol Directive (Routine Matrix)
*   7-day tactical matrix (Monday to Sunday) for routine organization.
*   Time-based visual rendering with dynamic height calculation for task blocks.
*   Real-time visual indicator (red line) highlighting the current time.

### 4. Tactical Operations (Task Kanban)
*   Objective management using a classic Kanban board (Pending, Active, Completed, Aborted).
*   Drag-and-Drop support synchronized directly with the Firestore database.
*   Visual tagging system ("Unilavras", "Solargun", "Personal") and deadline tracking (T-Zero).

### 5. Media Execution (Entertainment)
*   Customizable Media Arrays (e.g., Anime, Games, Series)[cite: 4].
*   Dynamic injection of custom fields (Text String, Numeric Value, Dropdown, Checkbox) when creating arrays.
*   Management via a Drag-and-Drop system[cite: 3].

### 6. Logistics & Inventory (Supplies)
*   Inventory control divided into three operational states: *Stock*, *Active*, and *Depleted*.
*   **Predictive System:** The system calculates the average lifespan of an item based on usage history and projects the estimated depletion date.

##  Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/xavas-hud.git](https://github.com/your-username/xavas-hud.git)



OBS:

## Running the Application:

Due to the use of ES6 Modules (type="module"), the project cannot be opened using the file:// protocol.

Use an extension like Live Server (in VS Code) or run a local server (e.g., python -m http.server) in the root directory.

## Access:

Create a test user directly in Firebase Authentication.

Access through the login portal (login.html) by entering your email and password (note: the system automatically appends @gmail.com if no domain is provided in the username).



## Database Configuration (Firebase):

Create a project in the Firebase Console.

Enable the Authentication (Email/Password) and Firestore Database modules.

Register a web app to get your configuration keys.

Navigate to the js/core/firebase-config.js file and insert your credentials into the firebaseConfig object:

JavaScript


   ```bash
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
   };

