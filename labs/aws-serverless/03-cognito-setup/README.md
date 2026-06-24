# AWS Cognito Setup

Integrasi AWS Cognito untuk login user dan manajemen session tanpa database.

## 📋 Apa itu Cognito?

- **User Pools**: Manajemen user (register, login, reset password)
- **Identity Pools**: Manajemen akses ke AWS resources
- **OAuth 2.0**: Login tanpa hardcode password

## 🚀 Setup AWS Cognito

### Step 1: Buat User Pool

1. AWS Console → **Cognito** → **Create user pool**
2. **Pool name**: `idnlab-users`
3. **Cognito user sign-in options**: Email
4. Di setiap step, gunakan default settings, klik **Next**
5. Sampai step "Integrate your app", isi:
   - **App name**: `idnlab-web`
   - **Client type**: `Confidential client`
   - **Allowed callback URLs**: `http://localhost:3000/callback`
   - **Allowed sign-out URLs**: `http://localhost:3000/logout`
6. **Create user pool**

### Step 2: Konfigurasi App Client

1. Di User Pool → **App integration** → **App client settings**
2. Cari app `idnlab-web`
3. Copy dan catat:
   - **Client ID**
   - **Client Secret** (klik "Show Details")

### Step 3: Konfigurasi Domain

1. **App integration** → **Domain name**
2. Buat domain: `idnlab-dev` (akan menjadi `idnlab-dev.auth.ap-southeast-3.amazoncognito.com`)
3. Tunggu sampai status "Active"

### Step 4: Catat Credentials

Di `.env`, tambahkan:

```bash
COGNITO_USER_POOL_ID=ap-southeast-3_xxxxxxxxx
COGNITO_CLIENT_ID=abcdefg123456
COGNITO_CLIENT_SECRET=xxxxx
COGNITO_DOMAIN=idnlab-dev.auth.ap-southeast-3.amazoncognito.com
COGNITO_REGION=ap-southeast-3
COGNITO_REDIRECT_URI=http://localhost:3000/callback
```

## 💻 Integrasi di Web App

Flow:
1. User klik tombol "Login dengan Cognito"
2. Redirect ke Cognito login page
3. User login / register
4. Redirect kembali ke `/callback` dengan auth code
5. Backend tukar auth code dengan token
6. Session user aktif
7. User bisa lihat registrasi mereka

## 🔐 Keamanan

- **Client Secret** harus disimpan di `.env` (server-side only)
- User data tidak tersimpan di database lokal (optional)
- OAuth 2.0 Authorization Code flow

## 📚 Dokumentasi AWS

- https://docs.aws.amazon.com/cognito/
- https://docs.aws.amazon.com/cognito/latest/developerguide/user-pools.html

## ⚠️ Testing Lokal

Untuk development lokal tanpa Cognito:
- Set `COGNITO_ENABLED=false` di `.env`
- Gunakan simple session mock (akan di-implement di server.js)

Untuk production:
- Set `COGNITO_ENABLED=true`
- Cognito akan handle semua authentication
