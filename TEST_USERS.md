# Test Users for Education Platform

## 🧪 Test User Credentials

### 1. STUDENT User
```bash
Email: student@example.com
Password: password123
Role: STUDENT
Name: Student User
```

### 2. TEACHER User  
```bash
Email: teacher@example.com
Password: password123
Role: TEACHER
Name: Teacher User
```

### 3. ADMIN User
```bash
Email: admin@example.com
Password: password123
Role: ADMIN
Name: Admin User
```

### 4. PARENT User
```bash
Email: parent@example.com
Password: password123
Role: PARENT
Name: Parent User
```

## 🚀 Quick Test Commands

### Create Test Users
```bash
# Create Student
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "name": "Student User",
    "role": "STUDENT"
  }'

# Create Teacher
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123",
    "name": "Teacher User",
    "role": "TEACHER"
  }'

# Create Admin
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "name": "Admin User",
    "role": "ADMIN"
  }'

# Create Parent
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "password123",
    "name": "Parent User",
    "role": "PARENT"
  }'
```

### Login Test
```bash
# Login as Student
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

## 📱 Dashboard Features by Role

### 🎓 STUDENT Dashboard
- **My Courses**: View enrolled courses
- **Assignments**: View and submit assignments
- **Quizzes**: Take quizzes and see scores
- **Grades**: View grades and progress
- **Schedule**: View class schedule
- **Messages**: Communicate with teachers

### 👨‍🏫 TEACHER Dashboard
- **My Classes**: Manage assigned classes
- **Create Lessons**: Create and edit lessons
- **Assignments**: Create and grade assignments
- **Quizzes**: Create and manage quizzes
- **Grades**: Grade student work
- **Analytics**: View class performance
- **Messages**: Communicate with students

### 🛡️ ADMIN Dashboard
- **School Management**: Manage schools
- **User Management**: Manage all users
- **System Settings**: Configure platform
- **Analytics**: Platform-wide analytics
- **Reports**: Generate reports
- **Audit Logs**: View system activity

### 👨‍👩‍👧‍👦 PARENT Dashboard
- **Children**: View children's progress
- **Grades**: Monitor academic performance
- **Attendance**: Track attendance
- **Messages**: Communicate with teachers
- **Reports**: View progress reports
- **Schedule**: View children's schedule

## 🎯 Testing Steps

1. **Start API**: `cd apps/api && npm run dev`
2. **Start Mobile**: `cd apps/mobile && flutter run -d chrome`
3. **Create Users**: Run registration commands
4. **Test Each Role**: Login with each test user
5. **Verify Features**: Check role-specific dashboard

## 📊 Expected Dashboard Differences

### Navigation Menu
- **Student**: Courses, Assignments, Quizzes, Grades
- **Teacher**: Classes, Lessons, Assignments, Analytics
- **Admin**: Users, Schools, Settings, Reports
- **Parent**: Children, Progress, Messages, Reports

### Quick Actions
- **Student**: Enroll in course, Submit assignment
- **Teacher**: Create lesson, Grade assignment
- **Admin**: Add user, Configure settings
- **Parent**: View child's grades, Send message

## 🔍 What to Look For

1. **Role Detection**: Correct role identification
2. **UI Adaptation**: Different layouts per role
3. **Feature Access**: Only role-appropriate features
4. **Navigation**: Role-specific menu items
5. **Data Display**: Relevant information per role
