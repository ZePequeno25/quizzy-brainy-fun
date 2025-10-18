# Aprender em Movimento

## Project info

**URL**: https://lovable.dev/projects/77c82926-cc52-4e97-9f3b-585910fae583

## 🚀 Como rodar o projeto localmente

### Pré-requisitos
- Node.js e npm instalados - [instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Passo 1: Configurar o Frontend

1. Clone o repositório:
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Instale as dependências:
```sh
npm i
```

3. Configure a URL da API local:
   - Abra o arquivo `src/lib/api.ts`
   - Altere a linha 1 de:
   ```typescript
   const API_URL = 'https://aprender-em-movimento-js.onrender.com/api';
   ```
   Para:
   ```typescript
   const API_URL = 'http://localhost:5050/api';
   ```

4. Inicie o servidor de desenvolvimento:
```sh
npm run dev
```

### Passo 2: Configurar o Backend (API)

1. Navegue até a pasta da API:
```sh
cd API
```

2. Instale as dependências:
```sh
npm i
```

3. Crie um arquivo `.env` na pasta API com o seguinte conteúdo:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://77c82926-cc52-4e97-9f3b-585910fae583.lovableproject.com,https://b7d67252-99dc-4651-becb-4194ed477859.lovableproject.com
EMAIL_DOMAIN=saberemmovimento.com
FIREBASE_SERVICE_ACCOUNT={"type": "service_account","project_id": "nifty-pursuit-382200","private_key_id": "f9f60ee213f8cd535673403b5cfdb14d2c23e21d","private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDdW+tbg3E9WSK+\nHHmq2jVIuecIkJlLscPanZYkDrI9l12iDBEkUIKGp2CB5x0HnrH0PdwORCF59HLS\nK/v0szacKKayxqmNaezRx/Set3bWGb3DndzjD1xrz6Ne7Xogucr8cEdiZcbe9zqH\nLXYzZkRiUnryFmDfz+BYkpT9E4XPf7sVL11FJtbEQJDuc6TO9WisFEP4oXIu+/L1\ngiwI5FQw/P+fMdHdBupxDgBMzsfK9OPXphqmzbV/cBg0O8xiM761fjMqOzkp1auG\n3chbZXRllMiyACzFp36cMtYKNool6BmTJa8Or6pyRhElsTWDBeIAzereynz0OMdQ\nraYbN9M1AgMBAAECggEAVHGhamrNQzMCzvV78JKHqzPID/thj3/EEFz3js/QbTCW\nNqBV1b2k3YtyhHvPFj4S8vK6RPL2tlhriQPgfSv01EOpvB+PRPQ4tJqMFhQ1EF4H\nh11si24rurEeSLNdWKin5/9JLB9Za2ty92h/ZAJKahu+7SVeVWMu2XspvRW6gToq\nAcqupATlCb2bsuKk3x0TxXe8yqhTDfhYnFSAVsQDuB1rwSCZF297cDcfTqshGsGy\nvF+8qlan6mv+JOVFKwcjGnSaj79U/3hEh+nE/ScGEmCMbhH+90lvTBLP/mSR2wZV\n39q54dMpt1/zXafwJ3tiCmtynLnZ8mwJ5IUDnT6t7QKBgQD9ScRp062ToyHdNSAz\nz84Cl6+F9pWnZoA1XibR4AHFE278a2+4KIyXRmotTTImVslt32f7CEsPSzdSgiyt\nyYOYOni56ytO56z+2gat1uchLCi/RnDtI2WVBP8S8wUIWMyjRiYkBBD1hsI9deCU\n3a5QP2D2LzorqtN+1jwrQ2wedwKBgQDfuqNluvpsgEUTVg9R5CxQn0STtuWCXaEO\n1eDuWCW3Ln/0c5kzhMakTuSAmkbA6TXWtm2QKWg33yG3liblK3WRemuVJ+a76oP4\nf1pYbUpYvUVX5nijoXmj/KepzpQkeLNLuP0w0zaLR8Gv2ixLVeXX1lxOT6etaNTR\n228CwBkqswKBgEF/ONYw0brSvWgJW9lqDBiphs76c7qFC/RA84LkDTEcFGAbnBkg\nCzL3F2+9fZFicdYCpk3I2DgNODISzWDnMitEO4HAKUPPLvH8CSwc3Um7tJG5smvv\n8k21rAwHYa7F36z879HyZzxGa6Ye/EMii/feW8Ftdvphwy0SUx7Q4X2DAoGAXd9H\ns+WSMXhYg1Z2sxuT5HgPJBN3lQ2ICFuBN0BRAt1F3uGqBE3Psx1PDw6sZUD00BRX\nQEe/bMH4ubkMtNdZSyMchMbrLymlGd0FoVip+zXfJJSVRcL48O+PwdXlnq/uOvVx\nds0Ic8Q15n0aXLm76KYOsOUHK+FyemMh3vuPE7UCgYAmT3AOzEzDEPdDXrl6/Gkq\nGsvK3ZdEBmakSy97SZQfmmy4yuW3jucBcFiEEiDv42ovvbKCUZFcj+q58eJQfqUx\nYb01C9LawSdRicnPcaZUBynfJNhuAQ/W2i7UyFNfyjTr8PUDHoCUsUhCU6eLMfjr\nIO/xYnuXHqH+C6WaThhz+g==\n-----END PRIVATE KEY-----\n","client_email": "firebase-adminsdk-78gs5@nifty-pursuit-382200.iam.gserviceaccount.com","client_id": "108862715216983481126","auth_uri": "https://accounts.google.com/o/oauth2/auth","token_uri": "https://oauth2.googleapis.com/token","auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-78gs5%40nifty-pursuit-382200.iam.gserviceaccount.com","universe_domain": "googleapis.com"}
PORT=5050
```

4. Inicie o servidor da API:
```sh
npm start
```

A API estará rodando em `http://localhost:5050`

### ✅ Pronto!
- Frontend: `http://localhost:5173` (ou a porta que o Vite indicar)
- Backend API: `http://localhost:5050`

---

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/77c82926-cc52-4e97-9f3b-585910fae583) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/77c82926-cc52-4e97-9f3b-585910fae583) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
