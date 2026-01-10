#!/bin/bash

# Create Test Users Script
echo "🚀 Creating test users for Education Platform..."

API_URL="http://localhost:3000/api/v1"

# Function to create user
create_user() {
    local email=$1
    local name=$2
    local role=$3
    
    echo "Creating $role: $email"
    
    curl -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"password123\",
            \"name\": \"$name\",
            \"role\": \"$role\"
        }"
    
    echo ""
    echo "✅ $role created successfully!"
    echo "----------------------------------------"
}

# Create all test users
create_user "student@example.com" "Student User" "STUDENT"
create_user "teacher@example.com" "Teacher User" "TEACHER"  
create_user "admin@example.com" "Admin User" "ADMIN"
create_user "parent@example.com" "Parent User" "PARENT"

echo "🎉 All test users created!"
echo ""
echo "📱 Test Credentials:"
echo "Email: student@example.com  | Password: password123 | Role: STUDENT"
echo "Email: teacher@example.com  | Password: password123 | Role: TEACHER"
echo "Email: admin@example.com    | Password: password123 | Role: ADMIN"
echo "Email: parent@example.com   | Password: password123 | Role: PARENT"
echo ""
echo "🚀 Now test each dashboard at: http://localhost:55489"
