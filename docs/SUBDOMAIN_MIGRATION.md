# Subdomain Migration Plan

**Status**: Future Enhancement (Post Phase 1)
**Current Architecture**: Path-based routing
**Target Architecture**: Subdomain-based routing

---

## Current State (Phase 1)

### URL Structure
- **Admin Pages**: `mytechnavigator.vercel.app/riverside/forms`
- **Public Pages**: `mytechnavigator.vercel.app/riverside/food-permit-form`
- **Account Resolution**: Extract slug from URL path (`/[accountSlug]/...`)

### Advantages
✅ No CORS complexity
✅ No wildcard DNS setup
✅ Simple local development
✅ Single SSL certificate
✅ Faster MVP delivery

### Limitations
❌ Longer URLs
❌ Account visible in every URL
❌ Less white-label feel
❌ Not ideal for branding isolation

---

## Target State (Future)

### URL Structure
- **Admin Pages**: `riverside.mytechnavigator.ai/forms`
- **Public Pages**: `riverside.mytechnavigator.ai/food-permit-form`
- **Account Resolution**: Extract slug from subdomain

### Advantages
✅ Cleaner, shorter URLs
✅ Better brand isolation
✅ More professional appearance
✅ Better for white-labeling
✅ Account context is implicit

### Challenges
❌ CORS configuration needed
❌ Wildcard DNS setup
❌ More complex local development
❌ Migration effort for existing users

---

## When to Migrate

Migrate when **any** of the following conditions are met:

1. **Auth0 Tier Upgrade**
   - Free tier limits to 5 organizations
   - When you need more than 5 accounts, you'll upgrade Auth0
   - At that point, subdomain migration becomes worthwhile

2. **Custom Domain Acquisition**
   - When you acquire `mytechnavigator.ai` domain
   - Subdomains look better on custom domains
   - Good time to make the switch

3. **White-Labeling Requirement**
   - If customers want their own branded URLs
   - Subdomains provide better isolation and branding

4. **User Base Growth**
   - When you have 10+ active accounts
   - When existing URLs are widely shared
   - Worth the migration effort at scale

**Recommendation**: Wait until you have custom domain AND need more than 5 Auth0 organizations.

---

## Migration Complexity

### Estimated Effort
**3-6 days** of development + testing

### What Needs to Change

#### 1. Account Resolution Middleware (1-2 days)
**Current**:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const accountSlug = path.split('/')[1] // Extract from path
  const account = await getAccountBySlug(accountSlug)
  // ...
}
```

**Future**:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const host = request.headers.get('host')
  const accountSlug = host.split('.')[0] // Extract from subdomain
  const account = await getAccountBySlug(accountSlug)
  // ...
}
```

**Effort**: ~1 day (thanks to abstraction layer!)

#### 2. URL Generation Helpers (~1 day)
**Current**:
```typescript
// lib/urls.ts
export function getAccountUrl(accountSlug: string, path: string) {
  return `/${accountSlug}${path}` // Path-based
}

export function getFormUrl(accountSlug: string, formSlug: string) {
  return getAccountUrl(accountSlug, `/${formSlug}`)
}
```

**Future**:
```typescript
// lib/urls.ts
export function getAccountUrl(accountSlug: string, path: string) {
  const domain = process.env.NEXT_PUBLIC_DOMAIN // mytechnavigator.ai
  return `https://${accountSlug}.${domain}${path}` // Subdomain-based
}

export function getFormUrl(accountSlug: string, formSlug: string) {
  return getAccountUrl(accountSlug, `/${formSlug}`)
}
```

**Effort**: ~1 hour to update functions, ~1 day to test all usages

#### 3. Redirects for Backward Compatibility (~1 day)
Add middleware to redirect old path-based URLs to new subdomain URLs:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Check if this is an old path-based URL
  if (path.match(/^\/[a-z0-9-]+\//)) {
    const accountSlug = path.split('/')[1]
    const remainingPath = path.substring(accountSlug.length + 1)

    // Redirect to subdomain
    const newUrl = `https://${accountSlug}.mytechnavigator.ai${remainingPath}`
    return NextResponse.redirect(newUrl, 301) // Permanent redirect
  }

  // Otherwise, handle subdomain-based routing
  // ...
}
```

**Effort**: ~1 day to implement and test redirects

#### 4. DNS Configuration (~1 hour)
- Add wildcard CNAME: `*.mytechnavigator.ai` → Vercel
- Configure in domain registrar
- Wait for propagation (can take 24-48 hours)

**Effort**: ~1 hour setup, 24-48 hours propagation

#### 5. Auth0 Configuration (~1 hour)
- Update callback URLs to support wildcard: `https://*.mytechnavigator.ai/api/auth/callback`
- Update logout URLs
- Test login flow

**Effort**: ~1 hour

#### 6. CORS Configuration (~1 day)
If you have any API endpoints that need to be called cross-origin:
- Configure CORS headers for `*.mytechnavigator.ai`
- Test cross-subdomain requests
- Handle cookies and sessions across subdomains

**Effort**: ~1 day (if needed)

#### 7. Local Development Setup (~2 hours)
Update local development to support subdomains:
- Option 1: Edit `/etc/hosts` to map `*.localhost` to `127.0.0.1`
- Option 2: Use tools like `localhost.run` or `ngrok`
- Option 3: Use `.local` domains with mDNS

**Effort**: ~2 hours for team to set up

---

## Migration Strategy

### Phase 1: Dual Support (Week 1)
- Add subdomain routing alongside path-based routing
- Both URL structures work simultaneously
- Internal links start using subdomain URLs
- Old path-based URLs still work (backward compatibility)

**Testing**:
- ✅ Subdomain URLs work for all pages
- ✅ Path-based URLs still work (redirects to subdomain)
- ✅ Auth0 login works with subdomain
- ✅ Sessions work across subdomains

### Phase 2: Soft Migration (Week 2-3)
- Add 301 redirects from path-based to subdomain URLs
- Update all documentation to use subdomain URLs
- Notify users of URL changes
- Monitor redirect analytics

**Communications**:
- Email existing users about URL changes
- Update any external links (marketing, docs, etc.)
- Add banner: "URLs have changed! Update your bookmarks"

### Phase 3: Grace Period (Weeks 4-8)
- Keep redirects active for 1-2 months
- Monitor redirect usage (declining over time)
- Provide support for users with issues

### Phase 4: Deprecation (Week 8+)
- Remove path-based routing code (optional, can keep redirects indefinitely)
- Clean up unused middleware
- Update documentation to remove old URLs

---

## Preparation in Phase 1

To make migration easy, follow these patterns during Phase 1 development:

### 1. Use URL Helper Functions
❌ **DON'T**:
```typescript
const formUrl = `/${accountSlug}/forms/${formId}` // Hardcoded
```

✅ **DO**:
```typescript
import { getFormUrl } from '@/lib/urls'
const formUrl = getFormUrl(accountSlug, formSlug)
```

### 2. Abstract Account Resolution
❌ **DON'T**:
```typescript
const accountSlug = pathname.split('/')[1] // Hardcoded path parsing
```

✅ **DO**:
```typescript
import { resolveAccountFromRequest } from '@/lib/account/resolver'
const account = await resolveAccountFromRequest(request)
```

### 3. Use Relative Links Where Possible
When linking within the same account:
```typescript
// Instead of:
href={`/${accountSlug}/forms`}

// Use Next.js Link with relative path:
href="/forms" // Middleware handles account context
```

### 4. Store Account Slug, Not Full URLs
In database, store slugs and construct URLs dynamically:
```typescript
// Database stores: { accountSlug: 'riverside', formSlug: 'food-permit' }
// URL constructed at runtime:
const url = getFormUrl(account.slug, form.slug)
```

---

## Testing Checklist

When migrating, test all of these scenarios:

### Authentication
- [ ] Login via Auth0 works on subdomain
- [ ] Logout works correctly
- [ ] Session persists across pages
- [ ] Multi-account users can switch accounts

### Routing
- [ ] All admin pages load on subdomain
- [ ] Public form pages work on subdomain
- [ ] Invalid subdomains show 404
- [ ] Root domain redirects appropriately

### Redirects
- [ ] Path-based URLs redirect to subdomain (301)
- [ ] Redirects preserve query parameters
- [ ] Redirects work for all routes (forms, sessions, settings)

### Data Isolation
- [ ] RLS policies still enforce account isolation
- [ ] Can't access other accounts' data via subdomain manipulation
- [ ] API endpoints validate account from subdomain

### CORS (if applicable)
- [ ] API requests work across subdomains
- [ ] Cookies are set correctly for subdomains
- [ ] Third-party integrations still work

### Local Development
- [ ] Subdomains work in local environment
- [ ] Team can develop and test locally
- [ ] Documentation is clear for setup

---

## Rollback Plan

If migration goes wrong, rollback procedure:

1. **Disable subdomain routing** in middleware (feature flag)
2. **Re-enable path-based routing** as primary
3. **Update DNS** to remove wildcard (if needed)
4. **Communicate to users** that subdomain URLs are temporarily unavailable
5. **Debug issues** before attempting migration again

**Rollback Time**: < 1 hour (if you use feature flags)

---

## Cost Considerations

### Vercel
- Wildcard domains may require Pro plan or higher
- Check Vercel pricing for subdomain support

### Auth0
- Organizations feature may require paid tier
- Check Auth0 pricing for organization limits

### SSL Certificates
- Wildcard SSL may cost extra depending on provider
- Vercel provides free SSL for wildcard domains

---

## Conclusion

**For Phase 1**: Use path-based routing for faster MVP delivery and simpler architecture.

**For Future**: Migrate to subdomain routing when scale justifies the effort (custom domain + more than 5 accounts).

**Preparation**: Use abstraction layers (URL helpers, account resolver) to make migration easy when the time comes.

**Estimated Migration Effort**: 3-6 days of focused development + testing, plus 4-8 weeks of grace period for user transition.
