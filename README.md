# Habari Connect AI

Internal employee AI platform for **Habari Media**.

## Quick start

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

## Access model

| Who | Access |
|-----|--------|
| Employees | No login. Must be on an approved office **public IP** (`OFFICE_IP_ALLOWLIST`). |
| Admins | Login at `/admin/login` + office public IP for admin pages/APIs. |

Local development allows `127.0.0.1` when `ALLOW_LOCAL_DEVELOPMENT=true`.

## Admin login

- URL: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- Email: `admin@habarimedia.com`
- Password: `Admin123!` (change before production)

## Office IP allowlist

1. Connect a laptop to the **office Wi-Fi** (turn off mobile data/VPN).
2. Sign in as admin and open `/admin/network-access`.
3. Copy the **detected public IP**.
4. Set in `.env` / production env:

```bash
OFFICE_IP_ALLOWLIST="196.10.20.30,102.40.50.0/24"
ALLOW_LOCAL_DEVELOPMENT="true"
```

5. Restart or redeploy.

Do **not** add private addresses (`192.168.x.x`, `10.x.x.x`, `172.16.x.x`).

If the office ISP changes the public IP, update the allowlist or access will stop.

## Company calendar

See `.env.example` for Google Sheets service-account variables. Employee calendar: `/dashboard/calendar`. Admin status: `/admin/calendar`.

## AI chat knowledge

Answers from published dashboard Knowledge, Sections, News, Contacts, Resources, and live calendar — on the office network only.

See `.env.example` for all required environment variables.
