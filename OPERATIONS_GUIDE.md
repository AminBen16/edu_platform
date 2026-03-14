# OPERATIONS GUIDE
**Education Platform - System Administration & Maintenance**

**Version**: 1.0  
**Last Updated**: 2026-03-14  
**Audience**: DevOps, System Administrators, On-Call Engineers  
**Status**: PRODUCTION READY

---

## QUICK START

### System Status
```bash
# Check API health
curl https://eduplatform-tau.vercel.app/

# Check security headers
curl -i https://eduplatform-tau.vercel.app/ | grep -E "strict|content-security|x-"

# View deployment logs
vercel logs
```

### Emergency Contacts
- **Incident Commander**: [Your contact]
- **Database Administrator**: [Your contact]
- **Security Team**: [Your contact]

---

## SYSTEM ARCHITECTURE

### Deployment
```
Front-End                 API Server               Database
├─ Next.js Admin    ├─ Express.js           ├─ PostgreSQL
├─ Vercel Static    ├─ Vercel Serverless    ├─ Prisma ORM
├─ React Components ├─ Node.js 18+          └─ Multi-tenant
└─ NextAuth Auth    └─ Port 3000 (dev) 
                       Vercel Runtime (prod)
```

### Key Services
| Service | URL | Status | Backup |
|---------|-----|--------|--------|
| API | https://eduplatform-tau.vercel.app | ✅ Active | Vercel Auto |
| Admin Dashboard | https://eduplatform-tau.vercel.app | ✅ Active | Vercel Auto |
| Database | PostgreSQL Production | ✅ Active | Daily Snapshots |
| Auth | NextAuth.js + JWT | ✅ Active | Session Tokens |

---

## CRITICAL ENVIRONMENT VARIABLES

**⚠️ NEVER COMMIT THESE TO GIT**

### Required for Production
```
NEXTAUTH_SECRET=<32+ char random string>    # JWT signing key
DATABASE_URL=postgresql://user:pass@host    # Database connection
NEXTAUTH_URL=https://eduplatform-tau.vercel.app
NEXT_PUBLIC_API_URL=https://eduplatform-tau.vercel.app/api
NODE_ENV=production
```

### How to Set in Vercel
1. Go to: vercel.com → Project → Settings → Environment Variables
2. Add each variable
3. Select: Production environment
4. Save
5. **Redeploy**: `vercel deploy --prod`

### Rotating NEXTAUTH_SECRET
**When**: If compromised or quarterly
**Steps**:
1. Generate new 32+ character random string
2. Update in Vercel Settings
3. Redeploy both apps
4. Monitor logs for JWT errors
5. Consider forcing re-login of all users

---

## DEPLOYMENT PROCEDURES

### Standard Deployment (No Code Changes)
```bash
# Production deployment with auto-rollback
vercel deploy --prod

# Check deployment status
vercel ls
```

### Hotfix Deployment (Critical Issues)
```bash
# Fix code
git checkout -b fix/critical-issue
# Make changes
git add .
git commit -m "fix: critical issue description"
git push origin fix/critical-issue

# Deploy immediately
cd apps/api && vercel deploy --prod
cd apps/admin && vercel deploy --prod

# Verify
curl -i https://eduplatform-tau.vercel.app/
```

### Rollback to Previous Deployment
```bash
# View deployment history
vercel ls

# Rollback to previous version
vercel rollback <deployment-id>

# Or use Vercel dashboard
# Deployments → Select previous → Promote to Production
```

---

## MONITORING

### Health Checks (Run Daily)
```bash
#!/bin/bash
# Daily health check script

API_URL="https://eduplatform-tau.vercel.app"

# Check API reachable
if curl -f $API_URL > /dev/null 2>&1; then
  echo "[OK] API is reachable"
else
  echo "[ALERT] API is down!"
  # Send alert to on-call engineer
fi

# Check database connection (requires auth)
if curl -f -H "Authorization: Bearer $TEST_TOKEN" $API_URL/api/v1/users > /dev/null 2>&1; then
  echo "[OK] Database is connected"
else
  echo "[ALERT] Database connection issue!"
fi

# Check response time
RESPONSE_TIME=$(curl -w %{time_total} -s -o /dev/null $API_URL/)
if (( $(echo "$RESPONSE_TIME < 1" | bc -l) )); then
  echo "[OK] API response time: ${RESPONSE_TIME}s"
else
  echo "[WARN] API slow: ${RESPONSE_TIME}s"
fi
```

### Key Metrics to Monitor
1. **API Availability**: % uptime (target: 99.5%)
2. **Response Time**: <200ms (p95)
3. **Error Rate**: <0.1% (404s excluded)
4. **Database Connections**: <10 concurrent
5. **CPU Usage**: <50% (Vercel manages)
6. **Memory Usage**: <256MB (serverless limit)

### Alerts to Configure
- [ ] API down > 5 minutes
- [ ] Response time > 1 second (p95)
- [ ] Error rate > 1%
- [ ] Database connection pool full
- [ ] 500 errors > 10/minute
- [ ] JWT validation failures > 50/minute
- [ ] Rate limiting triggered > 100/hour

---

## INCIDENT RESPONSE

### Level 1: API Degradation (Response Time Slow)
**Symptoms**: Response time > 500ms  
**Investigation**:
1. Check Vercel dashboard for deployment issues
2. Review API logs for slow database queries
3. Check database connection pool status
4. Monitor recent changes in git log

**Response**:
1. Identify slow query
2. Optimize query (add indexes, rewrite)
3. Deploy hotfix
4. Monitor metrics return to normal

### Level 2: API Down (500 Errors)
**Symptoms**: API returning 500 errors  
**Investigation**:
1. Check deployment succeeded
2. Verify environment variables in Vercel
3. Check database connection string
4. Review logs for exceptions

**Response**:
1. Verify NEXTAUTH_SECRET is set
2. Check DATABASE_URL is correct
3. Redeploy: `vercel deploy --prod`
4. If issue persists: rollback

### Level 3: Authentication Broken (401s)
**Symptoms**: All users getting 401 Unauthorized  
**Investigation**:
1. Check NEXTAUTH_SECRET configuration
2. Verify JWT signing working
3. Check token validation logic

**Response**:
1. Verify NEXTAUTH_SECRET in Vercel matches deployed code
2. Restart all users' sessions (logout)
3. Redeploy if needed
4. Monitor login success rate

### Level 4: Data Breach (Security Incident)
**Symptoms**: Unauthorized data access detected  
**Immediate Actions** (First Hour):
1. Take screenshot of evidence
2. Notify security team immediately
3. Preserve logs (don't delete)
4. Document timeline of events
5. Take system offline if needed (set maintenance mode)

**Investigation** (24-72 Hours):
1. Analyze access logs for suspicious activity
2. Identify compromised data
3. Determine root cause
4. Check if NEXTAUTH_SECRET was compromised
5. Review all recent changes

**Response** (As appropriate):
1. Rotate NEXTAUTH_SECRET
2. Force password reset for affected users
3. Enable enhanced logging
4. Implement additional monitoring
5. Write incident report
6. Notify users if personal data exposed

---

## COMMON TASKS

### Adding a New Feature
1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes in both API and Admin
3. Test locally: `npm run dev`
4. Commit: `git commit -m "feat: description"`
5. Push: `git push origin feature/new-feature`
6. Create Pull Request
7. After merge to main: `vercel deploy --prod`

### Fixing a Bug
1. Create bug branch: `git checkout -b fix/bug-description`
2. Write failing test (if applicable)
3. Fix bug
4. Verify test passes: `npm run test`
5. Commit: `git commit -m "fix: description"`
6. Push and create PR
7. Hotdeploy if critical: `vercel deploy --prod`

### Updating Dependencies
1. List outdated: `npm outdated`
2. Update: `npm update` or `npm install <package>@latest`
3. Test: `npm run build && npm run test`
4. Commit: `git commit -m "deps: update packages"`
5. Deploy: `vercel deploy --prod`

### Rotating Database Backups
1. **Automated** (handled by PostgreSQL provider)
2. **Manual backup** (if needed):
   ```bash
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```
3. **Restore from backup**:
   ```bash
   psql $DATABASE_URL < backup-20260314.sql
   ```

### Managing Database Migrations
1. Create migration: `npx prisma migrate dev --name feature_name`
2. Review generated SQL in: `packages/db/prisma/migrations/`
3. Test: `npm run db:push`
4. Commit migration files
5. On production: `npm run db:migrate`

---

## SECURITY PROCEDURES

### Weekly Security Checks
- [ ] Review access logs for suspicious activity
- [ ] Check for failed authentication attempts
- [ ] Verify no exposed secrets in git history
- [ ] Confirm rate limiting working
- [ ] Check HTTPS/TLS certificates valid
- [ ] Review user feedback for security issues

### Monthly Security Updates
- [ ] Update dependencies: `npm audit fix`
- [ ] Review security advisories
- [ ] Enable new security features
- [ ] Audit user access levels
- [ ] Review and update firewall rules

### Quarterly Security Audit
- [ ] Run penetration test
- [ ] Code security review
- [ ] Database audit (views, permissions)
- [ ] API security review
- [ ] Compliance check (GDPR, etc.)
- [ ] Update security policies

### Annual Security Assessment
- [ ] Full security audit
- [ ] Incident response drill
- [ ] Disaster recovery drill
- [ ] Update incident response plan
- [ ] Compliance certification

---

## PERFORMANCE OPTIMIZATION

### Identifying Performance Issues
```bash
# Check API response times
curl -w "Response time: %{time_total}s\n" https://eduplatform-tau.vercel.app/api/v1/lessons

# Profile database queries
# Enable Prisma query logging:
export DEBUG="prisma:*"

# Check build size
vercel inspect <deployment-id>
```

### Common Optimizations
1. **Database Indexing**: Add indexes on frequently queried fields
2. **Query Optimization**: Use Prisma 'select' to fetch only needed fields
3. **Caching**: Implement Redis caching (if needed)
4. **Bundle Size**: Tree-shake unused dependencies
5. **Image Optimization**: Use next/image component
6. **Cold Start**: Minimize dependencies, lazy load

---

## DISASTER RECOVERY

### Backup & Restore
**Automated Backups**: PostgreSQL provider handles daily backups
**Manual Backup**:
```bash
pg_dump $DATABASE_URL > backup.sql
```

**Recovery Procedure**:
1. Notify users of downtime
2. Restore database: `psql < backup.sql`
3. Verify data integrity
4. Redeploy application
5. Verify functionality
6. Notify users of restoration

### Failover Procedure
1. Switch to backup database (if available)
2. Update DATABASE_URL in Vercel
3. Redeploy: `vercel deploy --prod`
4. Monitor for issues
5. Migrate data to permanent solution

---

## COMPLIANCE & AUDITING

### Data Privacy (GDPR)
- [x] User consent for data collection
- [x] Data deletion requests (30-day process)
- [x] Secure password storage (bcryptjs)
- [x] Encrypted data transmission (HTTPS)
- [x] Access control by school

### Audit Logging
- [x] Authentication attempts logged
- [x] Data access logged
- [x] Admin actions logged
- [ ] Logs retained for 1 year
- [ ] Regular audit log review

### Compliance Artifacts
- [ ] Data Processing Agreement (DPA)
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Incident Response Plan
- [ ] Security Assessment Reports

---

## CONTACT & ESCALATION

### Support Escalation Path
```
Level 1: First Response (30 min)
└─ Check system status
└─ Verify it's not a user issue
└─ Engage Level 2 if needed

Level 2: Technical Investigation (2 hours)
└─ Access logs and monitoring
└─ Identify root cause
└─ Implement temporary fix
└─ Engage Level 3 if needed

Level 3: Emergency Response (1 hour)
└─ All hands on deck
└─ Full system analysis
└─ Execute rollback if needed
└─ Notify all stakeholders
```

### Stakeholder Notification
**Critical Outage** (> 15 min):
- Notify: Users, School Admins, Support Team
- Message: "We're experiencing issues. ETA for resolution: X minutes"
- Update: Every 15 minutes
- Resolved: Full explanations of what happened

---

## RUNBOOKS

### Runbook: API Deployment
```
1. Merge code to main branch
2. Verify all tests pass
3. Run: cd apps/api && vercel deploy --prod
4. Wait for "✓ Production" confirmation
5. Verify: curl https://eduplatform-tau.vercel.app/
6. Monitor logs: vercel logs --since 5m
7. Alert if any errors appear
```

### Runbook: Database Restore
```
1. Identify point-in-time to restore
2. Create snapshot from backup
3. Test restore on staging database
4. Backup current production data
5. Execute restore
6. Run: npx prisma introspect
7. Verify schema matches expected
8. Test application functionality
9. Monitor for issues
```

### Runbook: Security Incident
```
1. Document what you see
2. Take screenshots/logs
3. Do NOT alter evidence
4. Notify security team
5. Take system offline if needed
6. Wait for incident commander
7. Follow incident response plan
8. Document all actions taken
```

---

## REFERENCES

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **OWASP**: https://owasp.org
- **NIST**: https://csrc.nist.gov
- **GitHub**: Repository main branch
- **Logs**: Vercel deployment logs
- **Monitoring**: [Your monitoring platform]

---

**Last Reviewed**: 2026-03-14  
**Next Review**: 2026-04-14  
**Owner**: [Your Name/Team]  
**Status**: APPROVED FOR PRODUCTION
