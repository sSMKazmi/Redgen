# RedGen - Redbubble SEO & Trademark Assistant

RedGen is a powerful Chrome Extension designed to streamline the workflow for Redbubble artists. It leverages Google's **Gemini 2.0 Flash** AI to optimize product metadata (titles, tags, descriptions) while providing a robust **Trademark Risk Analysis** system to keep your account safe.

## 🚀 Features

### 🧠 AI-Powered Optimization
- **Smart Rewriting**: Uses Gemini 2.0 to rewrite titles and descriptions for better SEO and sales conversion.
- **Tag Generation**: Generates relevant, high-traffic tags based on your product image and initial data.

### 🛡️ Trademark "Officer" Risk System
- **1-5 Risk Scale**: Every tag is analyzed and assigned a risk score:
  - 🟢 **1 (Safe)**: Generic, safe terms (e.g., "vintage", "sunset").
  - 🟢 **2 (Low Risk)**: Broad concepts.
  - 🟡 **3 (Caution)**: Pop culture references, parodies.
  - 🟠 **4 (High Risk)**: Specific locations, borderline terms.
  - 🔴 **5 (Danger)**: Famous brands (Nike, Disney), lyrics, celebrities.
- **Visual Feedback**: Tags are color-coded (Emerald to Red) for instant risk assessment.

### ⚡ Workflow Tools
- **One-Click Scraping**: Instantly grab title, tags, and description from any Redbubble product page.
- **Drag-and-Drop Tag Manager**:
  - **Active Tags**: AI-generated tags.
  - **Preserved Tags**: Your "must-have" tags that are never removed.
  - Move tags between zones easily.
- **Autofill**: Automatically fills the Redbubble upload form with your optimized data.
- **Image Download**: Download the high-quality preview image directly from the extension.

### 💾 Local Storage
- **Auto-Save**: All your listings and edits are saved locally in your browser.
- **Data Migration**: Automatically updates your data structure when the extension updates.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **AI Model**: Google Gemini 2.0 Flash
- **Platform**: Chrome Extension (Manifest V3)
- **Icons**: Lucide React

---

## 📂 Project Structure

```
Redgen/
├── gemma.py                 # Python script for testing Gemini API prompts
├── img.py                   # Python script for testing image processing
├── redgen-extension/        # Main Chrome Extension Directory
│   ├── src/
│   │   ├── components/
│   │   │   └── ListingCard.tsx  # Core UI: Tag management, tabs, risk display
│   │   ├── content/
│   │   │   └── index.ts         # Content script: Bridges extension <-> Webpage
│   │   ├── hooks/
│   │   │   └── useStorage.ts    # Custom hook for Chrome Storage & Data Migration
│   │   ├── utils/
│   │   │   ├── gemini-api.ts    # Gemini API integration & Prompt Engineering
│   │   │   └── dom-helper.ts    # DOM selectors for Scraping & Autofilling
│   │   ├── types.ts             # TypeScript interfaces (Listing, TagItem, etc.)
│   │   ├── App.tsx              # Main entry point
│   │   └── main.tsx             # React root
│   ├── manifest.json        # Chrome Extension Manifest V3
│   ├── vite.config.ts       # Vite configuration
│   └── tailwind.config.js   # Tailwind configuration
└── README.md                # Project Documentation
```

---

## 💿 Installation & Usage

### Prerequisites
- Node.js & npm installed.
- A Google Gemini API Key (Free).

### Setup
1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd Redgen/redgen-extension
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Build the Extension**:
   ```bash
   npm run build
   ```
   This creates a `dist` folder.

4. **Load into Chrome**:
   - Open Chrome and go to `chrome://extensions/`.
   - Enable **Developer mode** (top right).
   - Click **Load unpacked**.
   - Select the `Redgen/redgen-extension/dist` folder.

### How to Use
1. **Open Side Panel**: Click the RedGen icon in your toolbar and select "Open Side Panel".
2. **Settings**: Click the gear icon ⚙️ and enter your **Gemini API Key**.
3. **Scrape**: Navigate to a Redbubble product page and click **"GRAB INFO"**.
4. **Optimize**: Click **"✨ OPTIMIZE"** to let AI rewrite your data and analyze tag risks.
5. **Edit**: Drag tags between "Active" and "Preserved". Delete risky tags (Red/Orange).
6. **Upload**: Go to the Redbubble upload page and click **"🚀 AUTOFILL"**.

---

## 🧩 Key Files Explained

- **`src/utils/gemini-api.ts`**: Contains the "Master Prompt" that instructs Gemini to act as a Trademark Officer. It defines the JSON schema for the 1-5 risk output.
- **`src/components/ListingCard.tsx`**: The heart of the UI. Handles the tab switching (Original vs. Optimized), the complex drag-and-drop logic for tags, and the dynamic color rendering based on risk scores.
- **`src/hooks/useStorage.ts`**: Manages data persistence. Includes a migration system that automatically converts old data formats (string tags) to the new rich object format (`{ text, riskScore }`) to prevent crashes.
- **`src/utils/dom-helper.ts`**: Contains the specific CSS selectors used to scrape data from Redbubble and inject data into the upload forms.

---

## ⚠️ Disclaimer
This tool is an assistant. **Always verify trademark risks manually.** The AI's risk assessment is probabilistic and may not catch every infringement or may flag safe terms incorrectly. You are responsible for your own account safety.
