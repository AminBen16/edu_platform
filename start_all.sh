#!/bin/bash

echo "This script will attempt to start all the services for the Edu Platform."
echo "Please make sure you have Node.js, npm, and Flutter installed."

# Exit immediately if a command exits with a non-zero status.
set -e

# Start the backend API
echo "---"
echo "Starting backend API in apps/api..."
cd apps/api
npm install
npm run dev &
API_PID=$!
cd ../..
echo "Backend API started with PID: $API_PID"
echo "---"


# Start the admin dashboard
echo "---"
echo "Starting admin dashboard in apps/admin..."
cd apps/admin
npm install
npm run dev &
ADMIN_PID=$!
cd ../..
echo "Admin dashboard started with PID: $ADMIN_PID"
echo "---"


# Start the mobile app
echo "---"
echo "Starting mobile app in apps/mobile..."
echo "This will run in the foreground. Press Ctrl+C to stop it."
cd apps/mobile
flutter run
cd ../..
echo "---"

# Wait for background jobs to finish when the script is interrupted
trap "kill $API_PID $ADMIN_PID; exit" INT
wait