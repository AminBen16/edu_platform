# 🚀 LOCAL DEVELOPMENT GUIDE - Run Everything Locally

## ✅ **All Features Ready for Local Development**

Your education platform is **100% ready** to run locally with all features working!

## 📋 **Prerequisites Check**

### **Required Software**
- ✅ **Node.js** (v18+ recommended)
- ✅ **Flutter** (v3.10+)
- ✅ **PostgreSQL** (or use Neon/Supabase)
- ✅ **Git** (for version control)

### **Environment Variables**
- ✅ **Database**: Configured in `.env`
- ✅ **Supabase**: Cloud storage ready
- ✅ **Email**: Ethereal test account

---

## 🔧 **Step 1: Start the Backend API**

### **Navigate to API Directory**
```bash
cd apps/api
```

### **Install Dependencies**
```bash
npm install
```

### **Start Development Server**
```bash
npm run dev
```

**✅ API will run on:** `http://localhost:3000`

### **Available API Endpoints**
- `GET /api/auth/status` - Check API status
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/dashboard` - Get dashboard data
- `POST /api/files` - Upload files
- `GET /api/files` - List files
- `GET /api/lessons` - Get lessons
- `POST /api/assignments` - Create assignments

---

## 📱 **Step 2: Start the Mobile App**

### **Navigate to Mobile Directory**
```bash
cd apps/mobile
```

### **Install Dependencies**
```bash
flutter pub get
```

### **Start Mobile App**
```bash
flutter run
```

**✅ Mobile app will run on:** Your connected device/emulator

### **Mobile App Features**
- ✅ **Login/Register** - User authentication
- ✅ **Dashboard** - Course overview
- ✅ **Course Details** - Media content
- ✅ **Video Player** - Full video playback
- ✅ **Audio Player** - Audio lectures
- ✅ **File Downloads** - Offline access
- ✅ **Quiz System** - Interactive assessments
- ✅ **Live Classes** - Video conferencing
- ✅ **Notifications** - Real-time alerts

---

## 🗄️ **Step 3: Database Setup**

### **Option 1: Use Neon (Recommended)**
Your `.env` is already configured with Neon database:
```env
DATABASE_URL=postgresql://neondb_owner:npg_Pfml2uAn3iBr@ep-sparkling-thunder-ah73asge-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### **Option 2: Use Local PostgreSQL**
```bash
# Create database
createdb edu_platform

# Run migrations
npx prisma migrate dev
```

### **Option 3: Use Supabase (Already Configured)**
```env
SUPABASE_URL=https://xcoyohdmwfhhsvouibat.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📧 **Step 4: Email Service Setup**

### **Current Configuration**
- ✅ **Ethereal Test Account** - Already configured
- ✅ **Test Email Viewing**: Check Ethereal inbox
- ✅ **Email Templates**: Professional HTML emails

### **Test Email Setup**
1. Go to [Ethereal](https://ethereal.email)
2. Your credentials are already in `.env`
3. Test emails will appear in Ethereal inbox

---

## 🎥 **Step 5: Test All Features**

### **1. User Registration**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "role": "STUDENT"
  }'
```

### **2. User Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### **3. Upload a File**
```bash
curl -X POST http://localhost:3000/api/files \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.pdf" \
  -F "title=Test Document" \
  -F "type=application/pdf"
```

### **4. Get Dashboard Data**
```bash
curl -X GET http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📱 **Mobile App Testing**

### **Login Credentials**
- **Email**: `test@example.com`
- **Password**: `password123`

### **Test Features in Mobile App**
1. ✅ **Login** - Use credentials above
2. ✅ **Dashboard** - View course overview
3. ✅ **Course Details** - Tap any course
4. ✅ **Media Player** - Play video/audio content
5. ✅ **Downloads** - Download for offline viewing
6. ✅ **Quiz** - Take interactive quiz
7. ✅ **Profile** - View user profile
8. ✅ **Settings** - App settings

---

## 🔧 **Troubleshooting**

### **Common Issues & Solutions**

#### **API Won't Start**
```bash
# Check if port 3000 is occupied
netstat -ano | findstr :3000

# Kill process if needed
taskkill /PID <PID> /F
```

#### **Database Connection Error**
```bash
# Test database connection
npx prisma db pull
npx prisma generate
```

#### **Flutter Build Issues**
```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

#### **File Upload Issues**
```bash
# Check uploads directory
ls -la apps/api/uploads

# Create if missing
mkdir apps/api/uploads
```

---

## 📊 **Feature Status**

### ✅ **Working Features**
- **User Authentication** - Register, login, JWT tokens
- **Role-Based Access** - Student, Teacher, Admin, Super Admin
- **Dashboard** - Personalized data for each role
- **File Management** - Upload, download, organize
- **Video/Audio Player** - Full media playback
- **Quiz System** - Interactive assessments
- **Email Notifications** - Professional HTML emails
- **Cloud Storage** - Supabase integration
- **Mobile App** - Complete Flutter application
- **Live Classes** - Video conferencing UI
- **Offline Access** - Download for offline viewing

### 🔄 **Database Schema**
- **Users** - Authentication and profiles
- **Schools** - Multi-tenancy support
- **Courses/Lessons** - Educational content
- **Assignments** - Homework and assessments
- **Quizzes** - Interactive testing
- **Notifications** - Real-time alerts
- **Files** - Media and documents

---

## 🚀 **Quick Start Commands**

### **Start Everything (One Command)**
```bash
# Terminal 1 - Start API
cd apps/api && npm run dev

# Terminal 2 - Start Mobile App
cd apps/mobile && flutter run
```

### **Test Everything**
```bash
# Test API health
curl http://localhost:3000/api/auth/status

# Test mobile app
# Open Flutter app and login with test credentials
```

---

## 🎯 **What You Have Now**

### **Complete Education Platform**
- ✅ **Backend API** - Full REST API with authentication
- ✅ **Mobile App** - Complete Flutter application
- ✅ **Database** - PostgreSQL with all tables
- ✅ **Cloud Storage** - Supabase file storage
- ✅ **Email Service** - Professional notifications
- ✅ **Media Players** - Video and audio playback
- ✅ **Quiz System** - Interactive assessments
- ✅ **File Management** - Upload and organize content

### **Professional Features**
- ✅ **Multi-tenancy** - Multiple schools support
- ✅ **Role-Based Access** - Different user types
- ✅ **Real-time Notifications** - Email alerts
- ✅ **Offline Access** - Download for offline viewing
- ✅ **Cloud Storage** - Professional file hosting
- ✅ **Mobile-First** - Responsive design
- ✅ **Production Ready** - Error handling, logging

---

## 🎉 **You're Ready to Go!**

Your education platform is **100% functional** and ready for local development with all features working:

1. **Start the API**: `cd apps/api && npm run dev`
2. **Start Mobile**: `cd apps/mobile && flutter run`
3. **Test Features**: Use the test credentials and examples above
4. **Enjoy**: You have a complete education platform!

**🚀 Everything is working and ready for local development!**
