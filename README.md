# 🤖 vChat-AI - Facebook Messenger Bot

**vChatbot AI** - Giải pháp Chatbot Facebook Messenger tích hợp AI cho chăm sóc khách hàng tự động, quản lý lead và hỗ trợ bán hàng.

**Tác giả:** Vũ Văn Nam Việt  
**Công ty:** Nam Việt IT - https://namvietit.com.vn  
**Hotline:** 0971.735.735

## 🎯 Mục tiêu dự án

Phát triển một MVP (Minimum Viable Product) cho Botchat AI tích hợp Facebook, tập trung vào:

- ✅ Chăm sóc khách hàng tự động (FAQ, trả lời bình luận)
- ✅ Tạo và quản lý khách hàng tiềm năng (Lead Generation)
- ✅ Hỗ trợ bán hàng và tư vấn cơ bản
- ✅ Dashboard quản lý hội thoại và leads
- ✅ Tối ưu hóa trải nghiệm khách hàng

## 🚀 Tính năng chính

### 1. Facebook Messenger Integration
- Webhook xử lý tin nhắn và postback
- Tự động trả lời FAQ thông minh
- Hỗ trợ Quick Replies và Button Templates
- Lưu trữ lịch sử hội thoại

### 2. Quản lý Khách hàng (CRM)
- Tự động tạo hồ sơ khách hàng từ Facebook
- Theo dõi lịch sử tương tác
- Phân loại khách hàng theo trạng thái
- Quản lý thông tin liên hệ

### 3. Lead Generation & Management
- Tự động phát hiện và tạo lead từ cuộc hội thoại
- Tính điểm lead thông minh (Lead Scoring)
- Theo dõi tiến trình chăm sóc lead
- Lập lịch follow-up và nhắc nhở

### 4. Dashboard Quản lý
- Thống kê tổng quan (conversations, leads, conversion rate)
- Danh sách hội thoại đang hoạt động
- Quản lý leads và hot leads
- Analytics cơ bản

### 5. FAQ Management
- Hệ thống FAQ thông minh với keyword matching
- Tự động học từ các cuộc hội thoại
- Phân loại câu hỏi theo chủ đề
- Thống kê usage của FAQ

## 🛠 Công nghệ sử dụng

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database với Mongoose ODM
- **Facebook Graph API** - Messenger Platform integration

### Frontend
- **HTML5/CSS3/JavaScript** - Dashboard interface
- **Bootstrap 5** - UI Framework
- **Chart.js** - Data visualization (future)

### Tools & Libraries
- **Axios** - HTTP client
- **Moment.js** - Date/time handling
- **Joi** - Data validation
- **Morgan** - HTTP request logging
- **Helmet** - Security middleware

## 📁 Cấu trúc dự án

```
vChat-AI/
├── src/
│   ├── app.js                 # Main application file
│   ├── config/
│   │   └── database.js        # MongoDB connection
│   ├── models/
│   │   ├── Customer.js        # Customer schema
│   │   ├── Conversation.js    # Conversation schema
│   │   ├── Lead.js           # Lead schema
│   │   └── Faq.js            # FAQ schema
│   ├── routes/
│   │   ├── messenger.js       # Facebook webhook routes
│   │   ├── dashboard.js       # Dashboard API routes
│   │   └── leads.js          # Lead management API
│   ├── services/
│   │   ├── MessengerService.js    # Facebook API handler
│   │   ├── ConversationService.js # Conversation logic
│   │   ├── LeadService.js         # Lead management
│   │   └── FaqService.js          # FAQ matching logic
│   └── views/
│       └── dashboard.html     # Dashboard interface
├── public/
│   ├── css/
│   │   └── dashboard.css      # Dashboard styles
│   └── js/
│       └── dashboard.js       # Dashboard functionality
├── docs/                      # Documentation
├── tests/                     # Unit tests
├── package.json
├── .env.example              # Environment variables template
└── README.md
```

## ⚙️ Cài đặt và Cấu hình

### 1. Clone Repository

```bash
git clone https://github.com/vannamvu/vChat-AI.git
cd vChat-AI
```

### 2. Cài đặt Dependencies

```bash
npm install
```

### 3. Cấu hình Environment Variables

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:

```env
# Environment Configuration
NODE_ENV=development
PORT=3000

# Facebook Messenger Configuration
FACEBOOK_ACCESS_TOKEN=your_facebook_page_access_token
FACEBOOK_VERIFY_TOKEN=your_webhook_verify_token
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/vchat-ai
```

### 4. Khởi chạy MongoDB

Đảm bảo MongoDB đang chạy trên máy local hoặc sử dụng MongoDB Atlas.

### 5. Khởi chạy ứng dụng

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🔗 Cấu hình Facebook Messenger

### 1. Tạo Facebook App
1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Tạo app mới và thêm Messenger product
3. Tạo Page Access Token từ page bạn muốn kết nối

### 2. Cấu hình Webhook
1. Webhook URL: `https://yourdomain.com/webhook`
2. Verify Token: (sử dụng giá trị trong .env)
3. Subscribe to: `messages`, `messaging_postbacks`

### 3. Subscribe App to Page
Sử dụng Page Access Token để subscribe app tới page.

## 📊 API Documentation

### Webhook Endpoints

#### POST /webhook
Nhận tin nhắn từ Facebook Messenger

#### GET /webhook
Verify webhook token

### Dashboard API

#### GET /dashboard/api/stats
Lấy thống kê tổng quan

#### GET /dashboard/api/conversations
Lấy danh sách hội thoại

#### GET /dashboard/api/leads  
Lấy danh sách leads

### Lead Management API

#### GET /api/leads
Lấy danh sách leads với filters

#### GET /api/leads/:id
Lấy thông tin lead cụ thể

#### PUT /api/leads/:id
Cập nhật thông tin lead

#### POST /api/leads/:id/notes
Thêm ghi chú cho lead

## 🎮 Sử dụng

### 1. Truy cập Dashboard
Mở trình duyệt và truy cập: `http://localhost:3000/dashboard`

### 2. Kiểm tra Webhook
Gửi tin nhắn tới Facebook Page đã kết nối để test bot

### 3. Quản lý Leads
- Xem danh sách leads trong Dashboard
- Theo dõi hot leads với điểm cao
- Cập nhật trạng thái và ghi chú cho leads

## 🧪 Testing

```bash
# Chạy unit tests
npm test

# Chạy linting
npm run lint

# Format code
npm run format
```

## 📈 Lộ trình phát triển

### ✅ Giai đoạn 1: MVP Core (Hiện tại)
- [x] Thiết kế kiến trúc hệ thống
- [x] Facebook Messenger integration  
- [x] Basic FAQ system
- [x] Lead generation và scoring
- [x] Dashboard quản lý cơ bản
- [x] Database schema và models

### 🔄 Giai đoạn 2: Enhanced Features
- [ ] AI/NLP integration (OpenAI/DialogFlow)
- [ ] Advanced analytics và reporting
- [ ] Bulk messaging và campaigns
- [ ] Multi-language support
- [ ] Mobile-responsive dashboard
- [ ] User authentication và roles

### 🚀 Giai đoạn 3: Advanced Automation
- [ ] Workflow automation
- [ ] Integration với CRM/ERP systems
- [ ] A/B testing cho messages
- [ ] Voice message support
- [ ] Chatbot training interface
- [ ] Advanced lead nurturing

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

**Vũ Văn Nam Việt**
- Website: https://namvietit.com.vn
- Email: info@namvietit.com.vn
- Phone: 0971.735.735

## 🙏 Acknowledgements

- [Facebook Messenger Platform](https://developers.facebook.com/docs/messenger-platform/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Bootstrap](https://getbootstrap.com/)

---
**⭐ Nếu dự án này hữu ích, hãy star repository để ủng hộ! ⭐** 
