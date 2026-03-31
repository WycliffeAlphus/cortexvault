# CortexVault Kenya

> **Decentralized neural data consent for community health research in Kenya.**

[![Live Link](https://img.shields.io/badge/Live-Link-brightgreen)](https://cortexvault-jade.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)
[![Built for PL Genesis Hackathon 2026](https://img.shields.io/badge/PL%20Genesis-2026-purple)](https://cortexvault-jade.vercel.app/)

A patient-facing consent wallet where users store encrypted biosignal data on Filecoin, grant and revoke researcher access via Lit Protocol's programmable conditions, and receive SMS notifications when their data is accessed — mobile-first, bilingual (English / Swahili).

Built for the **PL Genesis Hackathon 2026** — Cognitive Sovereignty & Neural Data Rights track.

**[Live Link →](https://cortexvault-jade.vercel.app/)** 

**Watch Demo**

https://github.com/user-attachments/assets/cfa67088-dfb7-426c-939d-c88a7bb3fb7a

---

## How It Works

### Patient flow
1. Connect with a wallet address (or use demo mode)
2. Upload an EEG session — encrypted with Lit Protocol, stored on Storacha/Filecoin
3. Grant a researcher access: set their name, purpose, and an expiry date
4. View the full audit log of every access event
5. Revoke access at any time — the researcher is blocked immediately
6. Receive an SMS: *"Dr. Odhiambo accessed your brain data on March 30"*

### Researcher flow
1. Connect with a wallet address
2. See all datasets patients have granted access to
3. Click to decrypt and view (Lit Protocol checks conditions on-chain)
4. After revocation, decryption fails with *"Access revoked by data owner"*

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js 14 + Tailwind CSS + shadcn/ui |
| Storage | [Storacha](https://web3.storage) (`@web3-storage/w3up-client`) |
| Access control | [Lit Protocol](https://developer.litprotocol.com) v8 SDK |
| SMS notifications | [Africa's Talking](https://africastalking.com) API |
| Demo data | PhysioNet EEG Motor Movement dataset |
| Deployment | Vercel |

---

## Project Structure

```
app/
├── page.tsx                  # Landing / language selector
├── patient/
│   ├── page.tsx              # Patient dashboard (consents, audit log, ethics)
│   └── upload/page.tsx       # EEG upload flow
├── researcher/
│   └── page.tsx              # Researcher portal
└── api/
    ├── upload/route.ts       # Storacha upload handler
    ├── grant/route.ts        # Lit Protocol access grant
    ├── revoke/route.ts       # Lit Protocol revocation
    └── notify/route.ts       # Africa's Talking SMS trigger
components/
├── ConsentCard.tsx           # Grant/revoke UI card
├── AuditLog.tsx              # Access event trail
├── EthicsPanel.tsx           # Ethics disclosure built into the app
├── LanguageToggle.tsx        # EN / SW switcher
└── ui/                       # shadcn/ui primitives
lib/
├── storacha.ts               # Storacha client wrapper
├── lit.ts                    # Lit Protocol encrypt/decrypt/conditions
├── sms.ts                    # Africa's Talking client wrapper
└── store.ts                  # localStorage state (datasets, grants, audit log)
locales/
├── en.json                   # English strings
└── sw.json                   # Swahili strings
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` and fill in your keys:

```bash
cp .env.example .env.local
```

```bash
# Storacha (web3.storage w3up)
# Sign up at web3.storage, create a space, then:
#   npx w3 key create           → STORACHA_KEY
#   npx w3 proof create ...     → base64 encode → STORACHA_PROOF
STORACHA_KEY=
STORACHA_PROOF=

# Africa's Talking SMS (free sandbox at africastalking.com)
AT_API_KEY=
AT_USERNAME=sandbox
AT_SENDER_ID=CortexVault
```

Lit Protocol (Naga Dev testnet) requires no API key — just install the SDK.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Mode

No API keys required to explore the app. On the upload page, click **Load Demo EEG** to use a synthetic biosignal file. Use any wallet address string to log in — the full grant/revoke/audit flow works entirely from localStorage.

---

## Ethics

CortexVault is built on the principle that individuals own their neural data.

- Researchers must state a purpose and accept a time-limited access window
- Patients can revoke consent instantly at any time
- All data is encrypted at rest; CortexVault never holds decryption keys
- Every access event is logged and the patient is notified by SMS
- Compliant with the **Kenya Data Protection Act 2019**

---

## License

MIT © 2026 CortexVault Kenya
