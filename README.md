# 🎓 Multi-School Education Platform

Free, Vercel-based, mobile-first education system supporting multiple schools, teachers, subjects, levels, and students.

**Live Demo**: [Deploy to Vercel with 1 Click](#deploy-to-vercel)

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Mobile**: Flutter (web & native)
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL (Neon - free tier)
- **Deployment**: Vercel (free plan supports this)
- **Real-time**: Socket.IO
- **ORM**: Prisma
- **Authentication**: NextAuth.js

## Features

### Core Features
- ✅ Multi-school support with complete isolation
- ✅ Teachers, Students, Admins - role-based access control
- ✅ Complete lesson management system
- ✅ Quiz & assessment system with auto-grading
- ✅ Assignment submissions & grading
- ✅ Real-time classroom chat
- ✅ Live video classes (WebRTC integration)
- ✅ Schedule management
- ✅ Attendance tracking
- ✅ Grade management & reporting

### In Development
- 📱 Mobile app (Flutter) - Web & Native builds
- 📧 Email notifications (optional)
- 📊 Advanced analytics & reports
- 🔍 Full-text search

## Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- PostgreSQL database (free from Neon)
- GitHub account (for Vercel deployment)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/edu_platform.git
cd edu_platform

# 2. Run setup script
./setup.sh          # macOS/Linux
# or
setup.bat           # Windows

# 3. Configure environment
# Edit .env.local with your Neon connection string

# 4. Run database migrations
npm run db:migrate

# 5. Start development servers
npm run dev

# Access:
# - Admin Dashboard: http://localhost:3000
# - API: http://localhost:3001
```

## Deployment to Vercel (Free Tier)

### ⚡ One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2Fedu_platform&env=DATABASE_URL,NEXTAUTH_SECRET&envDescription=Database%20and%20auth%20secrets)

### Manual Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete step-by-step instructions.

**TL;DR**:
1. Create free Neon PostgreSQL account (https://console.neon.tech)
2. Get connection string from Neon
3. Push code to GitHub
4. Connect to Vercel (https://vercel.com/new)
5. Add environment variables
6. Deploy!

## Project Structure

```
edu_platform/
├── apps/
│   ├── admin/              # Next.js admin dashboard
│   ├── api/                # Express.js REST API
│   └── mobile/             # Flutter mobile app
├── packages/
│   ├── db/                 # Prisma ORM & migrations
│   ├── auth/               # Authentication utilities
│   └── shared/             # Shared types & utilities
├── DEPLOYMENT_GUIDE.md     # Complete deployment instructions
├── setup.sh / setup.bat    # Automated setup script
└── vercel.json             # Vercel configuration
```

## Database Schema

The platform uses a multi-tenant architecture with complete school isolation:

### Core Models
- **School**: Multi-school support with settings
- **User**: Teachers, Students, Admins
- **Teacher/Student**: Role-specific profiles
- **Subject**: Course organization
- **Class**: Grade/Section management
- **Lesson**: Learning content with resources
- **Quiz/Question**: Assessment system
- **Assignment/Submission**: Homework & grading
- **LiveSession**: Real-time classes
- **Chat/Message**: Real-time communication

See [packages/db/schema.prisma](./packages/db/schema.prisma) for complete schema.

## API Documentation

API runs at `/api/v1` with the following routes:

```
POST   /api/v1/auth/login              # User login
POST   /api/v1/auth/register           # Register with invite code
POST   /api/v1/auth/invite             # Create user invitation
GET    /api/v1/users                   # List users
POST   /api/v1/assignments             # Create assignment
GET    /api/v1/assignments             # List assignments
POST   /api/v1/quizzes                 # Create quiz
GET    /api/v1/live-sessions           # List live classes
...and more
```

See specific route files in `apps/api/src/routes/` for full API details.

## Authentication

- **NextAuth.js** for session management
- **JWT tokens** for API authentication
- **Role-based access control (RBAC)**
  - ADMIN: Full platform access
  - TEACHER: Create & manage content
  - STUDENT: View & submit assignments

### Default Seed Credentials
After running `npm run db:seed`:
- Email: `admin@kavuma.com` / Password: `password`
- Email: `teacher@kavuma.com` / Password: `password`
- Email: `student@kavuma.com` / Password: `password`

## Database Management

```bash
# View database visually
npm run db:studio

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed

# Generate Prisma Client
npm run db:generate
```

## Building for Production

```bash
# Build all apps
npm run build:all

# Build specific apps
npm run build:api       # Build Express API
npm run build:admin     # Build Next.js admin
npm run build:mobile    # Build Flutter web

# Start production server
npm start
```

## Environment Variables

### Required
- `DATABASE_URL`: PostgreSQL connection string from Neon
- `NEXTAUTH_SECRET`: Random 32+ character string (generate: `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for dev, https://yourdomain.vercel.app for production)

### Optional
- `NEXT_PUBLIC_API_URL`: API endpoint (default: http://localhost:3001/api/v1)
- `NODE_ENV`: development or production
- `SENTRY_DSN`: Error tracking (Sentry)
- `SMTP_*`: Email configuration
- `SUPABASE_*`: File storage

See `.env.local.example` for all options.

## Troubleshooting

### Database Connection Error
```bash
# Verify DATABASE_URL in .env.local
# Make sure it's a valid PostgreSQL connection string
npm run db:migrate
```

### Port Already in Use
```bash
# API runs on port 3001, Admin on 3000
# Kill existing process or change PORT env var
```

### Prisma Client Not Generated
```bash
npm run db:generate
npx prisma generate
```

### Build Failures
```bash
# Clear build artifacts
rm -rf apps/*/dist apps/*/.next packages/*/dist

# Rebuild everything
npm run build:all
```

## Scaling the Application

### Neon Database
- Free tier: 5GB storage, 3 projects
- Pro tier ($15/mo): 100GB, unlimited projects
- Enterprise: Custom limits, dedicated support

### Vercel
- Free tier: Sufficient for small deployments
- Pro ($20/mo): Higher limits, priority support
- Enterprise: Custom SLAs

### Optimization Tips
1. Enable database connection pooling in Neon
2. Optimize images with Next.js Image component
3. Implement API caching with Redis (if needed)
4. Monitor performance with Vercel Analytics
5. Set up error tracking with Sentry

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file

## Support

- 📖 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Step-by-step deployment
- 🐛 [Issues](https://github.com/YOUR_USERNAME/edu_platform/issues) - Report bugs
- 💬 [Discussions](https://github.com/YOUR_USERNAME/edu_platform/discussions) - Ask questions
- 📧 [Email Support](mailto:support@yourdomain.com)

## Roadmap

- [ ] Mobile app native builds (iOS/Android)
- [ ] Advanced analytics & ML-powered insights
- [ ] Video recording & playback
- [ ] Parent/Guardian portal
- [ ] Automated grading rubrics
- [ ] Resource library & content management
- [ ] Third-party OAuth (Google, Microsoft)
- [ ] API rate limiting & webhooks

## Security

- All data encrypted in transit (HTTPS)
- Password hashed with bcrypt
- JWT tokens for API authentication
- Environment variables for secrets
- SQL injection protection via Prisma
- CORS configured for production

## Performance

- Next.js SSR for faster page loads
- API caching with HTTP headers
- Database connection pooling
- Socket.IO for efficient real-time updates
- Vercel CDN for global edge caching

## Monitoring & Logging

```bash
# View Vercel logs
vercel logs <project-url>

# Local development logs
npm run dev  # Shows both API and admin logs
```

---

**Made with ❤️ for educators worldwide**

Last updated: March 5, 2026

