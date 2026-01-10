# 🧪 Dashboard Testing Guide

## 🎯 Current Dashboard Implementation

### Role-Based UI Elements
The dashboard currently shows:
- **Welcome Message**: "Welcome back, {name}!"
- **Role Badge**: Color-coded role indicator
- **Role Colors**:
  - **STUDENT**: Blue
  - **TEACHER**: Green  
  - **ADMIN**: Purple
  - **PARENT**: Orange
  - **SUPER_ADMIN**: Red

## 🚀 Quick Testing Steps

### 1. Start Both Services
```bash
# Terminal 1 - API Server
cd apps/api
npm run dev

# Terminal 2 - Flutter App  
cd apps/mobile
flutter run -d chrome
```

### 2. Create Test Users
Copy and paste these commands in your terminal:

```bash
# Create Student User
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "name": "Student User",
    "role": "STUDENT"
  }'

# Create Teacher User
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123",
    "name": "Teacher User",
    "role": "TEACHER"
  }'

# Create Admin User
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "name": "Admin User",
    "role": "ADMIN"
  }'

# Create Parent User
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "password123",
    "name": "Parent User",
    "role": "PARENT"
  }'
```

### 3. Test Each Dashboard

#### 🎓 STUDENT Dashboard Test
```
Login: student@example.com / password123
Expected:
- Blue role badge saying "STUDENT"
- Welcome message: "Welcome back, Student User!"
- Student-specific features (courses, assignments, quizzes)
```

#### 👨‍🏫 TEACHER Dashboard Test  
```
Login: teacher@example.com / password123
Expected:
- Green role badge saying "TEACHER"
- Welcome message: "Welcome back, Teacher User!"
- Teacher-specific features (classes, lessons, grading)
```

#### 🛡️ ADMIN Dashboard Test
```
Login: admin@example.com / password123
Expected:
- Purple role badge saying "ADMIN"
- Welcome message: "Welcome back, Admin User!"
- Admin-specific features (user management, settings)
```

#### 👨‍👩‍👧‍👦 PARENT Dashboard Test
```
Login: parent@example.com / password123
Expected:
- Orange role badge saying "PARENT"
- Welcome message: "Welcome back, Parent User!"
- Parent-specific features (children progress, reports)
```

## 📱 What You'll See in Each Dashboard

### Common Elements (All Roles)
- **AppBar**: Dashboard title with notifications and profile menu
- **Welcome Section**: Personalized greeting with role badge
- **Navigation**: Role-specific menu items
- **Profile Menu**: Profile, Settings, Logout options

### Role-Specific Features

#### 🎓 STUDENT
- **My Courses**: View enrolled courses
- **Assignments**: Submit assignments
- **Quizzes**: Take quizzes
- **Grades**: View grades
- **Schedule**: Class schedule

#### 👨‍🏫 TEACHER  
- **My Classes**: Manage classes
- **Create Lessons**: New lesson creation
- **Grade Assignments**: Grading interface
- **Class Analytics**: Performance data
- **Student Messages**: Communication

#### 🛡️ ADMIN
- **User Management**: Add/edit users
- **School Management**: School settings
- **System Configuration**: Platform settings
- **Analytics**: Platform-wide data
- **Audit Logs**: System activity

#### 👨‍👩‍👧‍👦 PARENT
- **Children Overview**: Child progress
- **Grade Monitoring**: Academic performance
- **Attendance Tracking**: Attendance records
- **Teacher Communication**: Messages
- **Progress Reports**: Detailed reports

## 🔍 Testing Checklist

### Visual Verification
- [ ] Correct role badge color
- [ ] Correct role name displayed
- [ ] Personalized welcome message
- [ ] Role-specific navigation items

### Functional Testing
- [ ] Login works for each role
- [ ] Dashboard loads correctly
- [ ] Navigation menu shows correct items
- [ ] Profile menu works
- [ ] Logout functionality

### Data Verification
- [ ] User data loads correctly
- [ ] Role-based data filtering
- [ ] API calls work for each role
- [ ] Error handling works

## 🐛 Common Issues & Solutions

### CORS Error
```
Error: Access to fetch blocked by CORS policy
Solution: API server must be running with CORS enabled
```

### Login Issues
```
Error: Invalid credentials
Solution: Ensure users are created before testing login
```

### Dashboard Not Loading
```
Error: Dashboard data not loading
Solution: Check API server is running and accessible
```

## 🎯 Success Criteria

✅ **All 4 roles can login successfully**
✅ **Each dashboard shows correct role badge color**
✅ **Welcome message is personalized**
✅ **Role-specific features are accessible**
✅ **Navigation works correctly**
✅ **Profile and logout work**

## 📊 Expected Dashboard Layout

```
┌─────────────────────────────────────┐
│ 🏠 Education Platform        🔔 👤 │
├─────────────────────────────────────┤
│ Welcome back, User Name!           │
│ 🏷️ [ROLE]                        │
├─────────────────────────────────────┤
│ 📊 Quick Stats                    │
│ ┌─────────┬─────────┬─────────┐   │
│ │ Stat 1  │ Stat 2  │ Stat 3  │   │
│ └─────────┴─────────┴─────────┘   │
├─────────────────────────────────────┤
│ 🎯 Role-Specific Actions          │
│ • Action 1                        │
│ • Action 2                        │
│ • Action 3                        │
├─────────────────────────────────────┤
│ 📱 Role-Specific Content          │
│ ┌─────────────────────────────────┐ │
│ │ Content Area                    │ │
│ │ (varies by role)              │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 🚀 Ready to Test!

1. **Start API**: `cd apps/api && npm run dev`
2. **Start Mobile**: `cd apps/mobile && flutter run -d chrome`
3. **Create Users**: Run the curl commands above
4. **Test Each Role**: Login with each test user
5. **Verify Features**: Check role-specific functionality

**🎉 You're ready to test all user dashboards!**
