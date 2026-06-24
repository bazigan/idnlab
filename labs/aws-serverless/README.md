# AWS Serverless Lab

Lab untuk memahami AWS Serverless Services: Lambda, API Gateway, dan Cognito.

## 📁 Labs Tersedia

### 1. Lambda Hello API
Endpoint sederhana yang merespons dengan "Hello from Lambda".

- **Folder**: `01-lambda-hello-api/`
- **Handler**: `handler.main`
- **Tombol di web**: "Say Hello from Lambda"
- **Lihat**: [README](01-lambda-hello-api/README.md)

### 2. Lambda Test Connection
Endpoint untuk test koneksi / health check ke Lambda.

- **Folder**: `02-lambda-test/`
- **Handler**: `handler.test`
- **Tombol di web**: "Test Lambda Connection"
- **Lihat**: [README](02-lambda-test/README.md)

### 3. Cognito Setup
Integrasi AWS Cognito untuk login user dan manajemen session.

- **Folder**: `03-cognito-setup/`
- **Fitur**: User Pools, Identity Pools
- **Lihat**: [README](03-cognito-setup/README.md)

---

## 🚀 Quickstart

1. **Deploy Lambda functions** ke AWS Console (lihat step di masing-masing folder)
2. **Update `.env`** dengan Lambda endpoints dan Cognito credentials
3. **Restart web app** → tombol Lambda dan login Cognito akan aktif

---

## 📋 Environment Variables

Di `.env`, tambahkan:

```bash
# Lambda API Endpoints
LAMBDA_HELLO_URL=https://xxx.lambda-url.ap-southeast-3.on.aws/
LAMBDA_TEST_URL=https://yyy.lambda-url.ap-southeast-3.on.aws/

# Cognito Configuration
COGNITO_USER_POOL_ID=ap-southeast-3_xxxxxxxxx
COGNITO_CLIENT_ID=abcdefg123456
COGNITO_CLIENT_SECRET=xxxxx
COGNITO_DOMAIN=idnlab-dev.auth.ap-southeast-3.amazoncognito.com
COGNITO_REDIRECT_URI=http://localhost:3000/callback
COGNITO_REGION=ap-southeast-3
```

Lihat `.env.example` untuk detail lengkap.

---

## 🔗 Integration Architecture

```
Web App (Express + EJS)
│
├─→ [Lambda 1] Hello API → "Say Hello from Lambda" button
├─→ [Lambda 2] Test Connection → "Test" button
└─→ [Cognito] User Pools → Login / Register
    │
    └─→ User Session Tracking (Order Status Page)
```

---

## 📚 Next Steps

1. Baca [Cognito Setup Guide](03-cognito-setup/README.md) untuk integrasi authentication
2. Deploy ke AWS lambda functions
3. Update environment variables
4. Test di web app
