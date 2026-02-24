# ✅ STROYKLIMAT Launch Checklist

## 🔧 Technical Setup (Complete This First)

### Code Customization
- [ ] Change admin PIN (js/admin.js line ~90)
  ```javascript
  // Current: 1234 (demo)
  // Change to your 4-digit PIN
  ```

- [ ] Update Telegram contact (js/showcase.js line ~95)
  ```javascript
  // Replace: @stroyklimat → your username
  // Replace: t.me/stroyklimat → your chat link
  ```

- [ ] Update phone numbers
  ```javascript
  // Replace: +380509735955 → your phone
  // In js/showcase.js, product.html, catalog.html, etc.
  ```

- [ ] Update email contact
  ```javascript
  // Replace: info@stroyklimat.net → your email
  // In files: showcase.js, catalog.html, contacts.html
  ```

- [ ] Update logo (./assets/logo.svg)
  ```bash
  # Option 1: Replace SVG file
  cp your-logo.svg assets/logo.svg
  
  # Option 2: Update HTML (index.html line 16)
  <img src="./assets/your-logo.png" alt="logo"/>
  ```

- [ ] Add Viber number for click-to-call
  ```javascript
  // In showcase.js search for "viber.click"
  // Add your Viber account
  ```

### Data Import
- [ ] Export your product catalog to JSON
- [ ] Access admin panel: http://localhost:8000/admin.html (PIN: 1234)
- [ ] Navigate to Import/Export tab
- [ ] Upload your catalog JSON file
- [ ] Review changes (added/updated/deleted items)
- [ ] Click "Accept"
- [ ] Verify products appear in Main tab
- [ ] Export backup of published catalog

### Theme & Design
- [ ] Verify dark theme looks good (default)
- [ ] Test light theme (click 🌙 button)
- [ ] Check all pages render correctly:
  - [ ] homepage: index.html
  - [ ] catalog: catalog.html
  - [ ] product: product.html?id=hvac-001
  - [ ] cart: cart.html
  - [ ] favorites: favorites.html
  - [ ] about: about.html
  - [ ] contacts: contacts.html
  - [ ] delivery: delivery.html
  - [ ] returns: returns.html
  - [ ] privacy: privacy.html
  - [ ] admin: admin.html (PIN: your-new-PIN)

---

## 📱 Device Testing (Test On Each)

### Desktop
- [ ] Chrome (Windows/Mac)
  - [ ] Dark theme
  - [ ] Light theme
  - [ ] Search functionality
  - [ ] Cart operations
  - [ ] Admin login
  
- [ ] Firefox (Windows/Mac)
  - [ ] All features working
  
- [ ] Safari (Mac)
  - [ ] All features working
  
- [ ] Edge (Windows)
  - [ ] All features working

### Mobile
- [ ] iPhone (Safari)
  - [ ] Responsive layout
  - [ ] Touch buttons work
  - [ ] Admin accessible (PIN entry)
  - [ ] Showcase mode functional
  
- [ ] Android (Chrome)
  - [ ] Responsive layout
  - [ ] Showcase mode with Telegram/Viber
  - [ ] Admin panel usable

### Tablet
- [ ] iPad (Safari)
  - [ ] Layout works
  - [ ] Admin panel functional

---

## 🌐 Deployment Setup

### Choose Hosting
- [ ] Vercel (recommended)
- [ ] Netlify
- [ ] GitHub Pages
- [ ] Self-hosted (FTP/SSH)

### Domain Registration
- [ ] Domain purchased (stroyklimat.ua or your-domain.com)
- [ ] Domain access ready
- [ ] Registrar credentials saved

### SSL Certificate
- [ ] If Vercel/Netlify: Auto-configured ✓
- [ ] If self-hosted: Certbot + Let's Encrypt installed

### DNS Configuration
- [ ] DNS records noted
- [ ] Nameservers updated (if required)
- [ ] A records pointing to host
- [ ] MX records verified (if email needed)

---

## 🚀 Deployment

### Build & Test Locally
```bash
# 1. Clone/check code
cd stroyklimat/site

# 2. Start local server
python -m http.server 8000
# or
npx http-server

# 3. Test in browser
open http://localhost:8000

# 4. Test admin
open http://localhost:8000/admin.html
# PIN: your-new-PIN
```

### Deploy to Vercel
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel deploy --prod

# Result: https://stroyklimat.vercel.app
```

OR deploy to Netlify
```bash
netlify deploy --prod --dir=site
```

---

## ✅ Pre-Launch Verification

### Core Functionality
- [ ] Homepage loads (index.html)
- [ ] Catalog displays products
  - [ ] Search works
  - [ ] Filters work
  - [ ] Pagination (50/100 items)
  
- [ ] Product page works
  - [ ] Images load
  - [ ] Price displays
  - [ ] "Add to cart" button works
  
- [ ] Cart functionality
  - [ ] Add/remove items work
  - [ ] Quantity +/- buttons work
  - [ ] Total price calculates
  - [ ] Data persists (refresh page)
  
- [ ] Favorites functionality
  - [ ] Toggle works
  - [ ] Data persists
  
- [ ] Admin panel
  - [ ] Login with new PIN works
  - [ ] Product list loads
  - [ ] New product creation works
  - [ ] Product edit works
  - [ ] Delete works
  - [ ] Statistics show correct counts
  - [ ] Import/Export works
  - [ ] Mode toggle works (shop ↔ showcase)

### Showcase Mode (if enabled)
- [ ] Price request modal appears
- [ ] Form fields work:
  - [ ] Name input
  - [ ] Phone input
  - [ ] Email input (optional)
  - [ ] Comment textarea
  
- [ ] Share buttons work:
  - [ ] Telegram link opens
  - [ ] Viber link opens
  - [ ] WhatsApp link opens
  - [ ] Email mailto works
  
- [ ] Message text pre-filled correctly
- [ ] Copy to clipboard works

### Admin Settings
- [ ] Mode change works (Shop → Showcase)
- [ ] "Publish" button saves
- [ ] "Reset" button restores

---

## 📊 Analytics & Monitoring

### Google Analytics
- [ ] GA4 tracking ID added (if using)
- [ ] Test events firing:
  - [ ] Page view registered
  - [ ] Add to cart tracked
  - [ ] Search tracked

### Error Tracking
- [ ] Sentry (optional) configured
- [ ] Error reports working

### Uptime Monitoring
- [ ] UptimeRobot setup
- [ ] Monitoring started
- [ ] Alert email configured

---

## 🔐 Security

### Authentication
- [ ] Admin PIN changed from 1234
- [ ] No hardcoded passwords in code
- [ ] HTTPS enabled (green lock 🔒)

### Data
- [ ] No API keys exposed
- [ ] localStorage limits acceptable
- [ ] No sensitive data in client code
- [ ] XSS protection verified (textContent used)

### Network
- [ ] HTTPS/SSL working (test with browser)
- [ ] CSP headers set (if applicable)
- [ ] Security headers visible (curl -i)

---

## 📞 Contact Information

### Verify All Updated
- [ ] Telegram: @username (js/showcase.js)
- [ ] Viber: +380... (js/showcase.js)
- [ ] WhatsApp: +380... (js/showcase.js)
- [ ] Email: your@email.com (files)
- [ ] Phone: +380... (multiple files)

### Support Links
- [ ] Email support functional
- [ ] Social media links active
- [ ] Contact form works (if applicable)

---

## 🎨 Content & SEO

### SEO Checks
- [ ] Page titles set correctly
- [ ] Meta descriptions added
- [ ] OpenGraph tags present
- [ ] Schema.org markup configured
- [ ] Sitemap.xml exists (or auto-generated)
- [ ] robots.txt configured

### Mobile SEO
- [ ] Viewport meta tag ✓
- [ ] Mobile-friendly test passed
- [ ] Images optimized
- [ ] Links not too small

---

## 📝 Documentation

### Publishing
- [ ] README.md reviewed
- [ ] USER_GUIDE.md finalized
- [ ] DEPLOYMENT.md updated with your info
- [ ] SAAS_STRATEGY.md (for business)
- [ ] CHANGELOG.md current

### Support Resources
- [ ] FAQ updated
- [ ] Troubleshooting guide ready
- [ ] Contact info clear
- [ ] Social links working

---

## 🎯 Launch Day Tasks

### Morning (Before Going Live)
- [ ] Final code review
- [ ] Final deployment test (staging)
- [ ] Database backup (exported catalog.json)
- [ ] Screenshot of admin panel
- [ ] Test on all devices one more time

### Deployment
- [ ] Deploy to production
- [ ] Verify site loads (no errors)
- [ ] Test admin login
- [ ] Verify SSL certificate
- [ ] Check analytics tracking

### After Launch
- [ ] Send launch email to first customers
- [ ] Post on social media
- [ ] Update status page
- [ ] Monitor error logs
- [ ] Respond to first feedback

---

## 📊 Post-Launch Monitoring (First Week)

### Daily
- [ ] Check Lighthouse score (should be > 90)
- [ ] Review analytics traffic
- [ ] Monitor error reports
- [ ] Check admin panel functionality

### Weekly
- [ ] Review user feedback
- [ ] Check conversion metrics (if applicable)
- [ ] Update product catalog if needed
- [ ] Test showcase mode (price requests)

---

## 🔄 Regular Maintenance

### Monthly
- [ ] Review analytics
- [ ] Update product prices/catalog
- [ ] Backup IndexedDB data
- [ ] Check for JavaScript errors
- [ ] Test mobile again

### Quarterly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Feature request review
- [ ] Dependency updates

---

## 🎉 Success Metrics

### Launch Success (First Week)
- [ ] 0 critical errors
- [ ] 95+ Lighthouse score
- [ ] < 2 second load time
- [ ] Admin login working
- [ ] All pages accessible
- [ ] Search functionality active

### User Success (First Month)
- [ ] 50+ catalog views
- [ ] 10+ cart additions
- [ ] 5+ admin logins
- [ ] 0 major complaints
- [ ] Positive user feedback

---

## ❓ Common Issues During Launch

### Problem: "Cannot find catalog.json"
**Solution**: Verify path is `./site_data/catalog.json`
```bash
ls site/site_data/catalog.json
```

### Problem: "Admin PIN doesn't work"
**Solution**: Check you changed it correctly in js/admin.js
```javascript
// Should match your new PIN
const PIN_HASH = 'your-hash-here';
```

### Problem: "Dark theme not showing"
**Solution**: Clear browser cache
```bash
# Chrome: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
```

### Problem: "Images not loading on product page"
**Solution**: Check image URLs in catalog.json are absolute
```json
"images": ["https://example.com/image.jpg"]  // Good
"images": ["/path/to/image.jpg"]              // Bad (relative doesn't work)
```

### Problem: "Showcase mode buttons don't work"
**Solution**: Enable showcase mode in admin panel
```
Admin > Налаштування > Витрина (radio button) > Publish
```

---

## 📋 Final Sign-Off

- [ ] All items completed
- [ ] Site tested thoroughly
- [ ] Documentation reviewed
- [ ] Team aware of launch
- [ ] Support ready

**Signed Off By**: _________________________ Date: _________

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Status**: Ready to Launch ✅
