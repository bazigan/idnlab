# Lambda Test Connection

Endpoint AWS Lambda untuk test koneksi & health check.

## 🚀 Deploy ke AWS Console

Prosesnya **sama dengan Lambda Hello API**, dengan perbedaan:

### Perbedaan:

1. **Function name**: `test-connection` (bukan `hello-api`)
2. **Handler**: `handler.test` (bukan `handler.main`)
3. Copy-paste code dari `handler.js` file ini

### Step Lengkap:

1. AWS Console → **Lambda** → **Create Function**
2. Name: `test-connection`
3. Runtime: Node.js 20.x
4. Role: `AWSLambdaBasicExecutionRole`
5. **Create Function**
6. Edit code → Copy-paste dari `handler.js`
7. **Deploy**
8. **Create function URL** → Auth type: `NONE`
9. Copy URL

## 🧪 Test

```bash
curl https://xyz123.lambda-url.ap-southeast-3.on.aws/
```

Response:
```json
{
  "status": "SUCCESS",
  "message": "Success connection to lambda ✓",
  "timestamp": "2026-06-24T10:35:12.456Z",
  "processingTime": "45.23ms",
  "version": "1.0"
}
```

## 💻 Gunakan di Web App

Copy Function URL ke `.env`:

```bash
LAMBDA_TEST_URL=https://xyz123.lambda-url.ap-southeast-3.on.aws/
```

Tombol "Test Lambda Connection" akan memanggil endpoint ini.
