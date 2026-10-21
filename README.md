# WardWell EHR (Visual Prototype)

> **"Care, recorded with clarity."**  
> Visual prototype Electronic Health Record (EHR) system designed for hospital ward nursing and medical documentation.

---

## ⚠️ Important Clinical & Security Disclaimer
> [!CAUTION]
> **DO NOT ENTER REAL PATIENT OR HEALTH INFORMATION.**  
> WardWell EHR is a **front-end visual prototype** developed for demonstration, workflow validation, and educational interface exploration. All data is persisted strictly in the browser's local sandbox (`localStorage` / `sessionStorage`). While password-gated via a SHA-256 hash comparison, all client-side code and scripts are visible to anyone inspecting the page. It possesses **no HIPAA/DPA compliance, no encrypted database, and no server-side authentication**.

---

## 🏥 Project Overview & Design System
WardWell EHR provides a unified, calm, and clinical recording environment across 11 hospital ward documentation forms, replacing fragmented hospital paperwork with a unified design system.

### Color Tokens & Palette
| Token | Hex | Role | Contrast / WCAG AA |
|---|---|---|---|
| `--blush` | `#f7e4ea` | Soft accent surfaces, highlights, row hover | Secondary accent |
| `--cream` | `#fffaf4` | Warm paper and canvas background | Base light tone |
| `--sage-light` | `#b8cfb3` | Secondary buttons, chips, table header tints | Soft clinical border |
| `--sage` | `#83a081` | Accent elements, indicators, icons | Core brand tone |
| `--sage-dark` | `#3f603d` | High-contrast primary buttons, links, headings | **Passes WCAG 2.1 AA** (> 4.5:1) |
| `--ink` | `#0f1015` | High-contrast text, dark mode base surface | Primary typography |
| `--mist` | `#f3f3f3` | Input backgrounds, dividers, neutral states | Subtle neutral |

- **Clinical Palette:** Pure light clinical theme using `--cream` (#fffaf4) as the calming background, `--blush` (#f7e4ea) accents, `--sage` brand tones, and WCAG AA-compliant `--sage-dark` (#3f603d) and `--ink` (#0f1015) typography for optimal daylight ward legibility.
- **Typography:** DM Sans (clean, legible clinical UI) paired with Fraunces (warm editorial medical headings) and JetBrains Mono for clinical IDs.
- **Responsive:** Fluid layout supporting mobile viewports (360px+), tablets, laptops, and desktop screens with Fitts's law touch targets (≥ 44px).
- **Print Support:** Complete print stylesheet (`print.css`) with page break preservation, hidden navigation chrome, and a dedicated **Print Complete Chart** preview equipped with a sticky "← Back to Patient Chart" navigation bar.

---

## 📋 The 11 Clinical Hospital Forms

All forms share a standardized WardWell General Hospital clinical header with patient demographics strip, form code, revision date, and dual-mode View/Edit switching:

1. **Patient Information & Admission Form (`WW-ADM-01`):** Patient demographics, emergency contacts, insurance & PhilHealth information, admission details, admitting diagnosis, and patient admission declaration.
2. **Nursing Assessment Form (`WW-NUR-02`):** Social history, general survey (GCS, mobility, nutrition, hygiene), system-specific examination (Cardiovascular, Respiratory, GI, HEENT, GU, Integumentary), pain scale (0-10), Morse Fall Risk, and Braden Pressure Injury screening.
3. **Informed Consent (`WW-CNS-03`):** Procedural consent, treatment details, explanation of risks and alternatives, and interactive digital **Canvas Signature Pads** with touch/mouse drawing, clear, and undo.
4. **Doctor's Orders / Compliance Sheet (`WW-ORD-04`):** Physician order entries with CAR-ED compliance tracking (*C - Carried, A - Administered, R - Requested, E - Endorsed, D - Discontinued*), tagging by order type, and inline row CRUD.
5. **Vital Signs Monitoring (`WW-VIT-05`):** Shift-by-shift vitals (BP, HR, RR, Temp, SpO2, cough, pain scale, intake, urine/stool output) with subtle abnormal flagging and an **animated SVG Hemodynamic & Temperature Trend Chart**.
6. **IV Flow Record (`WW-IVF-06`):** Intravenous infusion tracking by bottle number, fluid solution, drop rate (gtts/min), anatomic cannulation site, gauge, amount received, amount infused, and consumption status.
7. **Nursing Care Plan / NCP (`WW-NCP-07`):** Systematic nursing care plans with Subjective/Objective Cues, NANDA-formatted Nursing Diagnoses, SMART Goals & Outcomes, Nursing Interventions, Scientific Rationale, and Outcome Evaluation.
8. **Medication Administration Record / MAR (`WW-MAR-08`):** Parenteral, Oral, and Topical drug schedules with prominent top allergy banner, scheduled shift time slots (7-3, 3-11, 11-7), and single-click slot status cycling (*Not Yet &rarr; Given &rarr; Held &rarr; Refused*).
9. **Nurse's Progress Notes (`WW-NPN-09`):** Chronological shift documentation in Focus / DAR (*Data &bull; Action &bull; Response*) format with nurse credential signatures and a Newest-First / Oldest-First toggle.
10. **Patient Endorsement Sheet (`WW-END-10`):** Shift handover sheet with SBAR (*Situation, Background, Assessment, Recommendation*) structure, pertinent physical exam parameters, and medications on board.
11. **Discharge Planning Form (`WW-DIS-11`):** Anticipated and confirmed discharge dates, destination, ADL special needs checklist, nutritional plans, take-home prescription instructions, and follow-up clinical appointments.

---

## 🚀 How to Run Locally

Because this project is built entirely with **vanilla HTML, CSS, and modern ES modules**, it requires **no build step, no compiler, and no npm packages**.

### Option A: Python 3 Static Server (Recommended)
Open a terminal in the project directory:
```bash
python -m http.server 8080
```
Then visit `http://localhost:8080/` in your browser.

### Option B: Node.js `npx serve` or `http-server`
```bash
npx serve .
# or
npx http-server -p 8080
```

### Option C: VS Code Live Server Extension
Right-click `index.html` in VS Code and select **"Open with Live Server"**.

> [!NOTE]
> Opening `index.html` directly via the `file://` protocol may cause some modern browsers to block ES module imports due to CORS security policies. Always run through a local static HTTP server or host on GitHub Pages.

---

## 🌐 Deploying to GitHub Pages

1. **Initialize Git & Commit:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: WardWell EHR prototype"
   ```
2. **Push to GitHub Repository:**
   ```bash
   git remote add origin https://github.com/your-username/wardwell-ehr.git
   git branch -M main
   git push -u origin main
   ```
3. **Enable GitHub Pages:**
   - In your GitHub repository, navigate to **Settings** &rarr; **Pages**.
   - Under **Build and deployment**, set **Source** to `Deploy from a branch`.
   - Select the `main` branch and `/ (root)` folder.
   - Click **Save**.
4. Your application will be live at:
   `https://your-username.github.io/wardwell-ehr/`
   *(All asset URLs, CSS paths, and router links are relative, ensuring seamless subfolder operation).*

---

## 🔑 Access Passcode & How to Change It

- **Default Passcode:** `Iloveward123`
- The system verifies the input by hashing it via the browser's native **Web Crypto API (`SHA-256`)** and comparing it against the stored hash in `js/config.js`.

### How to Generate a New Passcode Hash:
1. Open your browser console or terminal and generate the SHA-256 hex string.
   - **In Browser Console:**
     ```javascript
     async function hashPassword(pwd) {
       const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd));
       return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
     }
     await hashPassword('YourNewPasscodeHere');
     ```
   - **In PowerShell:**
     ```powershell
     $hasher = [System.Security.Cryptography.SHA256]::Create()
     $bytes = [System.Text.Encoding]::UTF8.GetBytes("YourNewPasscodeHere")
     ($hasher.ComputeHash($bytes) | ForEach-Object { $_.ToString("x2") }) -join ""
     ```
2. Open `js/config.js` and update `CONFIG.PASSWORD_HASH`:
   ```javascript
   export const CONFIG = {
     PASSWORD_HASH: 'your_generated_64_character_hex_hash_here',
     // ...
   };
   ```

---

## 🎨 How to Rebrand the System

All brand settings are centralized:
- **Hospital Name & Address:** Update `HOSPITAL_NAME`, `SYSTEM_NAME`, and `HOSPITAL_ADDRESS` in `js/config.js`.
- **System Logo:** Replace or edit SVG files in `/assets/`:
  - `assets/logo.svg` (Full logo with wordmark)
  - `assets/logo-icon.svg` (Icon mark for app header & favicon)
  - `assets/logo-mono.svg` (High-contrast monochrome variant for print stylesheet)
- **Colors:** Adjust the CSS custom properties in `css/base.css` under `:root` (`--blush`, `--cream`, `--sage`, `--sage-dark`, `--ink`, `--mist`).

---

## 💾 Storage & Data Management
- Data is stored in `localStorage` under `wardwell:v1:*`.
- **Export Data (JSON):** Open the settings modal (gear icon in the top header) and click **"Export All Data (JSON)"** to download a complete backup file.
- **Import Data (JSON):** Click **"Import JSON File..."** to restore records from any previously exported backup.
- **Reset Demo Data:** Click **"Reset to Factory Demo Data"** to restore the 11 fictional Filipino patients.
- **Undo Deletion:** Any deleted patient can be restored using the interactive undo toast within 8 seconds.

---

## 🖨️ Printing & PDF Export
- Individual forms can be printed via the **"Print Form"** action bar button.
- Complete patient charts can be printed via **"Print Complete Chart"** on the patient banner, compiling all 11 clinical forms sequentially with monochrome hospital headers, page break management, and zero UI chrome.

---

## 📌 Assumptions & Form Details
1. **Form 7 (Nursing Care Plan):** A reference photo for Form 7 was not provided in the original attachments. In accordance with Section 0 and Section 8 instructions, Form 7 was implemented following the standard Philippine / international 6-column Nursing Care Plan (Assessment / Cues, Nursing Diagnosis, Planning / Goals & Outcomes, Nursing Interventions, Scientific Rationale, Evaluation).
2. **Fictional Demonstration Patients:** All 11 pre-seeded patients are completely fictional characters with realistic Philippine clinical cases (e.g. Dengue Fever with Warning Signs, Community-Acquired Pneumonia, Hypertensive Urgency, HHS).
3. **Inactivity Auto-Lock:** Set to 15 minutes of inactivity with a warning toast triggered 1 minute beforehand.
