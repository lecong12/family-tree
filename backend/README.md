## Chạy backend local

Yêu cầu Node.js 20 và MongoDB đang chạy tại `localhost:27017`.

Từ thư mục gốc của repository, chạy trong PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
Set-Location backend
npm ci
npm run start:dev
```

API chạy tại `http://localhost:9999/api/v1`.
