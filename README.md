# Foodtracker

Web-App zum Tracken von Kalorien/Nährwerten, Gewichtsverlauf, Mahlzeitenplanung und Einkaufsliste.

**Stack:** React + TypeScript + Vite, Tailwind CSS, Supabase (Postgres + Auth), Open Food Facts API, recharts.

## Setup

1. **Supabase-Projekt anlegen**
   - Kostenloses Konto/Projekt auf [supabase.com](https://supabase.com) erstellen.
   - Im Dashboard unter *SQL Editor* den Inhalt von [`supabase/schema.sql`](supabase/schema.sql) einfügen und ausführen. Das legt alle Tabellen, Row-Level-Security-Policies und einen Trigger an, der bei Registrierung automatisch ein Profil anlegt.
   - Unter *Project Settings → API* die **Project URL** und den **anon public key** kopieren.

2. **Umgebungsvariablen**
   - `.env.local.example` nach `.env.local` kopieren und die beiden Werte eintragen:
     ```
     VITE_SUPABASE_URL=...
     VITE_SUPABASE_ANON_KEY=...
     ```
   - Für lokale Entwicklung ohne E-Mail-Bestätigung: in Supabase unter *Authentication → Providers → Email* die Option "Confirm email" deaktivieren, sonst muss jede Registrierung erst per Mail bestätigt werden.

3. **Installieren & starten**
   ```bash
   npm install
   npm run dev
   ```

## Scripts

- `npm run dev` – Dev-Server
- `npm run build` – Typecheck + Produktions-Build
- `npm run lint` – oxlint
- `npm run preview` – Produktions-Build lokal ansehen

## Hinweis zu npm audit

`npm audit` meldet zwei "high" Findings für `react-router` (RSC-Modus-CSRF). Diese App ist eine reine Client-Side-SPA ohne React-Server-Components/SSR, betroffen ist also nur ein Feature, das hier nicht verwendet wird.

## Datenquellen für Lebensmittel

- Eigene Lebensmittel werden manuell angelegt (`/foods`).
- Zusätzlich kann direkt beim Loggen/Planen in der [Open Food Facts](https://world.openfoodfacts.org)-Datenbank gesucht werden; ausgewählte Ergebnisse werden automatisch in die eigene Lebensmittel-Bibliothek übernommen.
