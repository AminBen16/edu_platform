@echo off
echo 🚀 Creating test users for Education Platform...

set API_URL=http://localhost:3000/api/v1

echo Creating STUDENT user...
curl -X POST "%API_URL%/auth/register" -H "Content-Type: application/json" -d "{\"email\":\"student@example.com\",\"password\":\"password123\",\"name\":\"Student User\",\"role\":\"STUDENT\"}"
echo.

echo Creating TEACHER user...
curl -X POST "%API_URL%/auth/register" -H "Content-Type: application/json" -d "{\"email\":\"teacher@example.com\",\"password\":\"password123\",\"name\":\"Teacher User\",\"role\":\"TEACHER\"}"
echo.

echo Creating ADMIN user...
curl -X POST "%API_URL%/auth/register" -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\",\"password\":\"password123\",\"name\":\"Admin User\",\"role\":\"ADMIN\"}"
echo.

echo Creating PARENT user...
curl -X POST "%API_URL%/auth/register" -H "Content-Type: application/json" -d "{\"email\":\"parent@example.com\",\"password\":\"password123\",\"name\":\"Parent User\",\"role\":\"PARENT\"}"
echo.

echo 🎉 All test users created!
echo.
echo 📱 Test Credentials:
echo Email: student@example.com  ^| Password: password123 ^| Role: STUDENT
echo Email: teacher@example.com  ^| Password: password123 ^| Role: TEACHER  
echo Email: admin@example.com    ^| Password: password123 ^| Role: ADMIN
echo Email: parent@example.com   ^| Password: password123 ^| Role: PARENT
echo.
echo 🚀 Now test each dashboard at: http://localhost:55489
pause
