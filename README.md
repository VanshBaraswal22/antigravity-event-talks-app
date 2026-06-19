# BigQuery Release Pulse

A premium, interactive web application built with a **Python Flask** backend and a responsive, dark glassmorphic **HTML5/Vanilla CSS/JavaScript** frontend. The app fetches the official Google Cloud BigQuery RSS Release Notes feed, structures each individual update, and allows users to search, filter, read, and instantly draft/post updates to Twitter.

---

## 🌟 Key Features

* **Sub-Entry Decomposition**: Daily release entries from the official Atom XML feed are automatically split by their internal `<h3>` sections (e.g., Features, Changes, Announcements, Issues). This allows selecting and sharing individual updates rather than massive daily blocks.
* **Premium Glassmorphic Design**: Features a highly polished dark interface with translucent cards (`backdrop-filter`), glowing indicators, and clean typography (Outfit & Inter fonts).
* **Responsive Layout**: 
  * **Desktop**: An elegant side-by-side split-pane layout showing the feed on the left and the selection detail view/tweet composer on the right.
  * **Mobile**: Automatically collapses into a single-column list with details opening in a slide-up drawer overlay.
* **Instant Client-Side Actions**: Offers immediate live searching and category filtering in Javascript, ensuring zero-latency updates to the feed view.
* **Accurate Twitter Intent Composer**: Automatically formats the selected release, truncates descriptions to fit within the 280-character limit, handles Twitter's exact `23-character` URL shortener rule, and opens pre-filled tweets using the official Twitter Web Intent.

---

## 📁 Project Structure

```text
├── app.py                # Flask Server & RSS Feed Parser (XML -> JSON)
├── requirements.txt      # Python Dependencies (Flask, requests)
├── .gitignore            # Ignores venv, local settings, and pycaches
├── templates/
│   └── index.html        # Main dashboard HTML template
└── static/
    ├── css/
    │   └── style.css     # CSS variable tokens, glassmorphic layout, drawer, and animations
    └── js/
        └── app.js        # Feed state management, live filters, character counters, & intent handlers
```

---

## 🛠️ Setup and Installation

### Prerequisites
Make sure you have Python 3.10+ installed on your system.

### 1. Clone & Navigate
Ensure you are in the project folder:
```powershell
cd "c:\Users\Vansh Baraswal\Downloads\agy-cli-projects"
```

### 2. Setup Virtual Environment
Create and activate your Python virtual environment:
```powershell
# Create environment
python -m venv venv

# Activate (Windows Powershell)
.\venv\Scripts\Activate.ps1

# Activate (Windows Command Prompt)
.\venv\Scripts\activate.bat
```

### 3. Install Dependencies
Install Flask and related packages:
```powershell
pip install -r requirements.txt
```

---

## 🚀 Running the App

Start the local development server:
```powershell
python app.py
```

Once running, open your web browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🌐 GitHub Repository

The code is committed and pushed directly to the following repository:
👉 **[VanshBaraswal22/antigravity-event-talks-app](https://github.com/VanshBaraswal22/antigravity-event-talks-app)**
