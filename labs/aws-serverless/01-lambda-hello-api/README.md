# Lambda Hello API

Endpoint AWS Lambda yang merespons dengan pesan "Hello from Lambda".

## 🚀 Deploy ke AWS Console

### Step 1: Buat Function

1. Buka AWS Console → **Lambda** → **Create Function**
2. **Function name**: `hello-api`
3. **Runtime**: Node.js 20.x
4. **Role**: Buat role baru dengan permissions `AWSLambdaBasicExecutionRole`
5. Klik **Create Function**

### Step 2: Upload Code

1. Di section **Code**, pilih **Edit in-line**
2. Hapus semua code default
3. Copy-paste code dari `handler.js`
4. Klik **Deploy**

### Step 3: Buat Function URL

1. Di halaman function, scroll ke section **Function URL**
2. Klik **Create function URL**
3. **Auth type**: `NONE` (tidak perlu auth)
4. Klik **Create function URL**
5. Copy URL yang dihasilkan, misal:
   ```
   https://abcdef123456.lambda-url.ap-southeast-3.on.aws/
   ```

## 📌 Penting

- Pastikan **Auth type** = `NONE` agar bisa diakses dari web
- CORS sudah dikonfigurasi di handler

## 🧪 Test

Via curl:
```bash
curl https://abcdef123456.lambda-url.ap-southeast-3.on.aws/
```

Response:
```json
{
  "message": "Hello from Lambda! 🚀",
  "timestamp": "2026-06-24T10:30:45.123Z",
  "requestId": "xxx-yyy-zzz",
  "version": "1.0"
}
```

## 💻 Gunakan di Web App

Setelah deploy, copy Function URL ke `.env`:

```bash
LAMBDA_HELLO_URL=https://abcdef123456.lambda-url.ap-southeast-3.on.aws/
```

Tombol "Say Hello from Lambda" di web akan memanggil endpoint ini.
