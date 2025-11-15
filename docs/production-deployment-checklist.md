# 1. Environment Variables (.env.example)
[✅] Create backend/.env.example
[✅] Create web/.env.example
[✅] Create bot/.env.example
[✅] Document all required variables

# 2. Backend Tasks
[✅] Implement Telegram OTP delivery (replace DEV mock)
[✅] Implement bot notification system (transfer results)
[✅] Uncomment authentication guards
[ ] Set DATABASE_PROVIDER=postgresql - NEXT (Deployment)
[ ] Run database migrations on production
[ ] Seed initial data (operators, admin user)

# 3. Web UI Tasks
[ ] Update NEXT_PUBLIC_API_URL to production URL
[ ] Build production bundle (npm run build)
[ ] Test with authentication enabled
[ ] Verify all API calls work with JWT cookies

# 4. Telegram Bot Tasks
[ ] Set BOT_MODE=webhook
[ ] Configure WEBHOOK_URL with HTTPS
[ ] Register webhook: bot.api.setWebhook(url)
[ ] Test internal endpoints with valid secrets
[ ] Verify OTP delivery via Telegram
[ ] Verify transfer notifications via Telegram

# 5. Infrastructure
[ ] Set up PostgreSQL database
[ ] Configure SSL/TLS certificates (Let's Encrypt)
[ ] Set up reverse proxy (Nginx)
[ ] Configure process manager (PM2)
[ ] Set up monitoring (logs, metrics, alerts)

# 6. Security
[ ] Generate strong secrets (32+ bytes)
[ ] Review all environment variables
[ ] Test authentication flows
[ ] Verify rate limiting works
[ ] Audit logs for sensitive data leaks
[ ] Test with different user roles

# 7. Testing
[ ] Test full user flow (Web UI login → create transfer → Android executes → notification)
[ ] Test admin dashboard (user management, system stats)
[ ] Test bot commands (/start, /send, /health)
[ ] Test error scenarios (backend down, invalid input)
[ ] Load testing (concurrent transfers)

# 8. Documentation
[ ] Update README.md files
[ ] Document deployment process
[ ] Document API endpoints
[ ] Create troubleshooting guide
[ ] Document backup/restore procedures