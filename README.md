# AllScent Marketing Hub — Guida al Deploy

## Cosa hai in questa cartella
Una web app completa con:
- Login Microsoft aziendale
- Dashboard personalizzata per ogni utente
- Moduli: Trade Visibility, Giornate PDV, Attività Interne, Social, Budget, PDV, To-do
- Pannello Admin per gestire utenti e permessi
- Database Supabase (dati condivisi in tempo reale)

---

## PASSO 1 — Configura il database Supabase (10 minuti)

1. Vai su **supabase.com** → apri il progetto `allscent-hub`
2. Nel menu a sinistra clicca **"SQL Editor"**
3. Clicca **"New query"**
4. Apri il file `supabase-schema.sql` (nella stessa cartella di questo README)
5. Copia **tutto** il contenuto e incollalo nell'editor SQL
6. Clicca **"Run"** (il triangolo verde in alto a destra)
7. Dovresti vedere "Success" — il database è pronto ✅

---

## PASSO 2 — Configura Microsoft Azure (5 minuti)

1. Vai su **portal.azure.com** → App registrations → **AllScent Marketing Hub**
2. Nel menu a sinistra clicca **"Authentication"**
3. Sotto "Single-page application" clicca **"Add URI"**
4. Aggiungi: `https://allscent-hub.vercel.app` (o il tuo dominio quando ce l'hai)
5. Clicca **"Save"**

---

## PASSO 3 — Carica il codice su GitHub (10 minuti)

1. Vai su **github.com** → clicca **"+"** in alto a destra → **"New repository"**
2. Nome: `allscent-hub`
3. Lascia tutto il resto com'è → clicca **"Create repository"**
4. GitHub ti mostra una pagina con istruzioni. Clicca il link **"uploading an existing file"**
5. Trascina tutti i file di questa cartella nella finestra del browser
   ⚠️ Trascina sia i file che le cartelle (src, public ecc.)
6. Scrivi un messaggio tipo "Prima versione" e clicca **"Commit changes"**

---

## PASSO 4 — Deploy su Vercel (5 minuti)

1. Vai su **vercel.com** → accedi con il tuo account GitHub
2. Clicca **"Add New Project"**
3. Trova `allscent-hub` nella lista e clicca **"Import"**
4. Vercel rileva automaticamente che è un progetto Next.js ✅
5. Prima di cliccare "Deploy", clicca **"Environment Variables"**
6. Aggiungi queste 4 variabili (una alla volta):

   | Nome | Valore |
   |------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://bjiqsqleljswotnlregd.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_XWsNo1bAcriBgPg4YMiGNg_aDlxal30` |
   | `NEXT_PUBLIC_AZURE_CLIENT_ID` | `c0cf2f86-6ad5-4f09-a3f0-efb0a4748f37` |
   | `NEXT_PUBLIC_AZURE_TENANT_ID` | `99e0c8d9-7a46-4eba-b08f-e96d0ec56ad3` |

7. Clicca **"Deploy"** — aspetta 2-3 minuti
8. Vercel ti dà un URL tipo `allscent-hub.vercel.app` — il sito è online! 🎉

---

## PASSO 5 — Configura il provider Microsoft su Supabase (5 minuti)

1. Vai su **supabase.com** → progetto `allscent-hub`
2. Nel menu a sinistra: **Authentication → Providers**
3. Trova **Azure** e clicca per espandere
4. Attiva il toggle **"Enable Azure provider"**
5. Inserisci:
   - **Application ID**: `c0cf2f86-6ad5-4f09-a3f0-efb0a4748f37`
   - **Secret**: lascia vuoto (usiamo PKCE flow)
   - **Tenant URL**: `https://login.microsoftonline.com/99e0c8d9-7a46-4eba-b08f-e96d0ec56ad3`
6. Copia la **"Redirect URL"** che mostra Supabase (tipo `https://bjiqsqleljswotnlregd.supabase.co/auth/v1/callback`)
7. Torna su Azure → AllScent Marketing Hub → Authentication → aggiungi questa URL come nuovo Redirect URI (tipo "Web", non SPA)
8. Clicca **"Save"** su entrambi

---

## PASSO 6 — Primo accesso

1. Apri `allscent-hub.vercel.app`
2. Clicca "Accedi con Microsoft"
3. Accedi con il tuo account `@allscentbeauty.com`
4. Il tuo profilo viene creato automaticamente
5. Per diventare superadmin: vai su Supabase → Table Editor → `profiles` → trova il tuo utente → cambia `role` da `editor` a `superadmin`
6. Da quel momento puoi gestire tutti gli altri utenti dal pannello Admin nella dashboard

---

## Aggiungere il dominio aziendale (opzionale)

1. Su Vercel → Settings → Domains → aggiungi `marketing.allscentbeauty.com`
2. Vercel ti dà un record DNS da aggiungere → manda le istruzioni al tuo sviluppatore
3. Su Azure → aggiungi `https://marketing.allscentbeauty.com` come Redirect URI
4. Su Supabase → Authentication → URL Configuration → aggiungi il dominio

---

## In caso di problemi

Scrivi a Claude con lo screenshot dell'errore — risolviamo insieme.
