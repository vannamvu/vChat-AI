# Hướng dẫn cài đặt vChat-AI

## Yêu cầu hệ thống

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0  
- **MongoDB**: >= 4.4 hoặc MongoDB Atlas
- **Facebook App**: Page Access Token và Webhook setup

## Cài đặt nhanh

### 1. Clone và cài đặt dependencies

```bash
git clone https://github.com/vannamvu/vChat-AI.git
cd vChat-AI
npm run setup
```

### 2. Cấu hình environment variables

```bash
cp .env.example .env
```

Chỉnh sửa `.env`:

```env
NODE_ENV=development
PORT=3000

# Facebook Configuration - BẮT BUỘC
FACEBOOK_ACCESS_TOKEN=your_page_access_token
FACEBOOK_VERIFY_TOKEN=your_custom_verify_token  
FACEBOOK_APP_SECRET=your_app_secret

# Database
MONGODB_URI=mongodb://localhost:27017/vchat-ai
```

### 3. Khởi chạy

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

## Cấu hình Facebook Messenger

### Bước 1: Tạo Facebook App

1. Truy cập [Facebook Developers Console](https://developers.facebook.com/)
2. Tạo app mới → Business → Messenger
3. Thêm Messenger product vào app

### Bước 2: Lấy Page Access Token

1. Trong Messenger settings → Access Tokens
2. Chọn Facebook Page muốn kết nối
3. Copy Page Access Token → dán vào `.env`

### Bước 3: Setup Webhook

1. Trong Messenger settings → Webhooks
2. Callback URL: `https://yourdomain.com/webhook`
3. Verify Token: (giá trị tự định nghĩa trong `.env`)
4. Subscription Fields: `messages`, `messaging_postbacks`

### Bước 4: Subscribe App to Page

Sau khi webhook được verify, subscribe app tới page để nhận tin nhắn.

## Kiểm tra cài đặt

### 1. Health Check

```bash
curl http://localhost:3000/health
```

### 2. Dashboard

Truy cập: http://localhost:3000/dashboard

### 3. Test Bot

Gửi tin nhắn "xin chào" tới Facebook Page để test bot.

## Troubleshooting

### Lỗi kết nối MongoDB

```bash
# Kiểm tra MongoDB đang chạy
mongod --version

# Hoặc sử dụng MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vchat-ai
```

### Webhook không nhận tin nhắn

1. Kiểm tra HTTPS (Facebook yêu cầu HTTPS)
2. Verify webhook signature
3. Đảm bảo app đã subscribe tới page

### Bot không trả lời

1. Kiểm tra console logs
2. Verify Page Access Token
3. Kiểm tra FAQ database đã được seed

## Deployment

### Sử dụng Heroku

```bash
# Install Heroku CLI
heroku create your-app-name
heroku config:set FACEBOOK_ACCESS_TOKEN=your_token
heroku config:set MONGODB_URI=your_mongodb_uri
git push heroku main
```

### Sử dụng Docker

```dockerfile
# Dockerfile sẽ được thêm trong giai đoạn tiếp theo
```

## Support

- **Documentation**: `docs/` folder
- **Issues**: GitHub Issues
- **Contact**: 0971.735.735 - Nam Việt IT