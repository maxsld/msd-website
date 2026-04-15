# Tracking + Dashboard Hebdo (MSD Media)

## 1) Ce qui est déjà branché dans le site

`assets/js/script.js` pousse automatiquement dans `dataLayer`:

- `msd_page_view`
- `scroll_depth`
- `time_on_page`
- `cta_click`
- `booking_intent`
- `booking_loaded`
- `booking_completed`
- `form_submit_attempt`
- `lead_submit_attempt`
- `lead_submit_success`
- `lead_submit_error`
- `lead_confirmed`

Le script charge aussi GTM (`GTM-P28B6QRF`) si le snippet n'est pas présent dans la page.

## 2) Heatmap (Microsoft Clarity)

Dans `assets/js/script.js`, définir l'ID Clarity via:

- `window.MSD_CLARITY_PROJECT_ID`, ou
- `data-clarity-project-id` sur `<html>`, ou
- `<meta name="msd-clarity-id" content="...">`

Exemple simple (dans le `<head>`):

```html
<meta name="msd-clarity-id" content="YOUR_CLARITY_PROJECT_ID">
```

## 3) Configurer GTM / GA4

1. Créer (ou vérifier) un tag `GA4 Configuration` dans GTM.
2. Déclencheur: `All Pages`.
3. Créer un tag `GA4 Event` pour chaque événement utile (ou un tag générique basé sur `{{Event}}`).
4. Publier le container.

Variables GTM recommandées:

- `event`
- `page_path`
- `page_type`
- `cta_kind`
- `cta_text`
- `cta_location`
- `time_on_page_seconds`
- `scroll_percent`
- `form_id`
- `error_type`

## 4) Rapport hebdo par email (automatique)

Le script est: `scripts/weekly-analytics-report.mjs`

Il récupère:

- GA4 (trafic, engagement, pages, events conversion)
- Search Console (clics, impressions, CTR, position, top queries/pages)

Puis envoie un email HTML via SMTP.

### Variables à configurer

1. Copier `.env.analytics.example` vers `.env.analytics`.
2. Remplir toutes les variables.
3. Pour l'expéditeur:
   - `MAIL_FROM=agence@msd-media.com`
   - Le SMTP doit autoriser cet expéditeur (SPF/DKIM/DMARC alignés).

### Test local

```bash
npm install
npm run analytics:weekly
```

## 5) Envoi automatique chaque semaine

Workflow prêt: `.github/workflows/weekly-analytics-report.yml`

1. Ajouter les secrets GitHub:
   - `GA4_PROPERTY_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
   - `GSC_SITE_URL`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `MAIL_FROM` (`agence@msd-media.com`)
   - `MAIL_TO` (`soldan.maxens@gmail.com`)
2. Le job tourne tous les lundis à `06:00 UTC`.

## 6) Droits Google nécessaires

Service account Google Cloud:

- Rôle lecture GA4 (property access)
- Rôle lecture Search Console (site property access)

Sans ces droits, le script échouera avec une erreur API.
