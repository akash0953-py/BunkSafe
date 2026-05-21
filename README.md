# BunkSafe 🎓

> Know exactly how many classes you can skip safely.

AI-powered attendance planning for college students. Upload your timetable image, let Gemini Vision read it, enter current attendance, and instantly know safe bunks, recovery needs, and semester projections.

---

## Quick Start

### 1. Get a Gemini API Key

Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) and create a free API key.

### 2. Set up environment

```bash
cp .env.local.example .env.local
```

Open `.env.local` and paste your key:

```
GEMINI_API_KEY=your_key_here
```

### 3. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How It Works

| Step | What happens |
|------|-------------|
| 1 | Upload timetable photo (PNG / JPG) |
| 2 | Gemini Vision AI extracts days, subjects, slot durations |
| 3 | You review & edit the extracted schedule |
| 4 | Enter attended / total classes per subject + holidays |
| 5 | Dashboard shows safe bunks, danger alerts, recovery plan |

---

## Calculation Logic

| Parameter | Value |
|-----------|-------|
| Semester working days | 60 (adjustable via holidays) |
| Working days/week | 5 (6 if Saturday detected) |
| Minimum attendance | **76%** |

**Safe Bunks** — how many of your *remaining* semester classes you can skip while still hitting 76%.

**Recovery** — consecutive classes you must attend now to bring *current* percentage above 76%.

**Predicted Final** — your attendance % at end of semester if you attend every remaining class.

---

## Project Structure

```
bunksafe/
├── app/
│   ├── api/extract-timetable/route.ts   ← Gemini Vision API route
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                         ← Multi-step flow orchestrator
├── components/
│   ├── LandingPage.tsx
│   ├── UploadPage.tsx                   ← Upload + Gemini extraction
│   ├── TimetablePage.tsx                ← Editable schedule
│   ├── AttendancePage.tsx               ← Input + holidays
│   ├── DashboardPage.tsx                ← Results
│   └── PageHeader.tsx
├── utils/
│   ├── gemini.ts                        ← Parse Gemini JSON → TimetableDay[]
│   ├── calculations.ts                  ← Attendance math (76%, 60-day semester)
│   └── cn.ts
├── types/
│   └── index.ts
├── .env.local.example                   ← Copy to .env.local
└── package.json
```

---

## Tech Stack

- **Next.js 14** App Router + TypeScript
- **Gemini Vision AI** (`gemini-2.5-flash`) for timetable extraction
- **Tailwind CSS** — dark theme, mobile-first
- **Lucide React** icons
- No database · No auth · No login
