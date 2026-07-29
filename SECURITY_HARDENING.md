# Security Hardening Guide - KKG Portal

## Completed Security Fixes

### 1. SUPABASE_KEY Removed from Repository
- **File**: `wrangler.jsonc`
- **Change**: Removed hardcoded `SUPABASE_KEY` from `vars` section
- **Status**: ✅ Completed

### 2. Maintenance Endpoints Protected
- **Endpoints**: 
  - `/api/db-patch/fix-notifications`
  - `/api/init-db`
- **Protection**: Admin-only middleware (`requireAdminOnly`)
- **Status**: ✅ Completed

---

## Required Production Setup Steps

### Step 1: Set SUPABASE_KEY as Secret

Before deploying to production, you MUST set the SUPABASE_KEY as a secret:

```bash
# Using Wrangler CLI
npx wrangler secret put SUPABASE_KEY

# When prompted, paste your Supabase service_role key:
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: Use the `service_role` key, NOT the `anon` key. The service_role key bypasses RLS policies.

### Step 2: Verify Secrets

```bash
npx wrangler secret list
```

You should see:
- ✅ SUPABASE_KEY

### Step 3: Rotate Compromised Credentials

**CRITICAL**: The old SUPABASE_KEY that was in the repository has been exposed. You MUST:

1. Go to Supabase Dashboard → Project Settings → API
2. Click "Generate new service_role key"
3. Delete the old key
4. Update the secret in Cloudflare:
   ```bash
   npx wrangler secret delete SUPABASE_KEY
   npx wrangler secret put SUPABASE_KEY
   ```

### Step 4: Deploy

```bash
npm run build
npx wrangler pages deploy
```

---

## Additional Security Recommendations

### 1. Enable Cloudflare WAF
- Go to Cloudflare Dashboard → Security → WAF
- Enable "High" security level
- Enable "Bot Fight Mode"

### 2. Set up Monitoring
- Enable Cloudflare Analytics
- Set up notification for 5xx errors
- Monitor failed authentication attempts

### 3. Regular Security Audits
- Review audit logs monthly
- Check for unauthorized access
- Monitor API rate limiting effectiveness

### 4. Session Security
- Sessions already expire (see `sessions` table)
- CSRF protection enabled
- Consider implementing IP-based session binding for high-security environments

---

## Security Checklist for Production

- [ ] SUPABASE_KEY set as Wrangler secret
- [ ] Old SUPABASE_KEY rotated in Supabase dashboard
- [ ] Maintenance endpoints return 403 for non-admin users
- [ ] Cloudflare WAF enabled
- [ ] HTTPS enforced (Cloudflare Pages default)
- [ ] No secrets in repository (verify with `git log -p --all -S 'SUPABASE_KEY'`)
- [ ] Admin accounts use strong passwords
- [ ] Rate limiting active (already configured)

---

## Incident Response

If you suspect a security breach:

1. **Immediate**: Rotate SUPABASE_KEY
2. **Immediate**: Check audit logs for unauthorized admin actions
3. **Within 1 hour**: Review user accounts for suspicious activity
4. **Within 24 hours**: Full security audit

---

**Last Updated**: $(date)
**Next Review**: 30 days
