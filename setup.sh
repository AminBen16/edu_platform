#!/bin/bash

# Education Platform - Setup Script
# This script helps you set up the project for development and deployment

set -e

echo "=========================================="
echo "🎓 Education Platform - Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${BLUE}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is not installed. Please install Node.js 16 or higher.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
echo ""

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}npm is not installed. Please install npm.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Creating .env.local from template...${NC}"
    cp .env.local.example .env.local
    echo -e "${YELLOW}Please edit .env.local with your actual values:${NC}"
    echo "  - DATABASE_URL: Your Neon PostgreSQL connection string"
    echo "  - NEXTAUTH_SECRET: Generate with: openssl rand -base64 32"
    echo ""
    echo "1. Go to https://console.neon.tech"
    echo "2. Create a new project"
    echo "3. Copy the connection string"
    echo "4. Edit .env.local with your values"
    echo ""
else
    echo -e "${GREEN}✓ .env.local exists${NC}"
fi
echo ""

# Generate Prisma Client
echo -e "${BLUE}Generating Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"
echo ""

# Test database connection
echo -e "${BLUE}Testing database connection...${NC}"
if npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
    
    # Run migrations
    echo -e "${BLUE}Running database migrations...${NC}"
    npx prisma migrate deploy
    echo -e "${GREEN}✓ Database migrations completed${NC}"
    
    # Optional seed
    read -p "Would you like to seed the database with sample data? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npx prisma db seed
        echo -e "${GREEN}✓ Database seeded${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Could not connect to database${NC}"
    echo "Make sure DATABASE_URL is set correctly in .env.local"
    echo "You can run 'npm run db:migrate' later when ready"
fi
echo ""

# Build instructions
echo -e "${GREEN}=========================================="
echo "✓ Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo -e "${BLUE}For local development:${NC}"
echo "  npm run dev"
echo ""
echo "For building:"
echo "  npm run build:all"
echo ""
echo "For database management:"
echo "  npm run db:studio    # Visual database browser"
echo "  npm run db:migrate   # Run migrations"
echo "  npm run db:seed      # Add sample data"
echo ""
echo -e "${BLUE}For deployment to Vercel:${NC}"
echo "  1. Read DEPLOYMENT_GUIDE.md"
echo "  2. Push to GitHub"
echo "  3. Connect project to Vercel"
echo "  4. Add environment variables"
echo "  5. Redeploy"
echo ""
