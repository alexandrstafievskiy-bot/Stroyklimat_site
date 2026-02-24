# 🚀 STROYKLIMAT Deployment Guide

## Quick Deploy

### ✅ Option 1: Vercel (Easiest)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy from site folder
cd site
vercel deploy --prod

# Result: https://stroyklimat.vercel.app
```

**✨ Advantages**:
- Free tier with unlimited bandwidth
- Auto SSL certificate
- Global CDN
- GitHub integration
- One-click rollback

### ✅ Option 2: Netlify

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Deploy
cd site
netlify deploy --prod --dir=.

# Result: https://stroyklimat.netlify.app
```

### ✅ Option 3: GitHub Pages

```bash
# 1. Create repository on GitHub
# github.com/your-username/stroyklimat

# 2. Push to gh-pages branch
git push origin site:gh-pages

# 3. Enable GitHub Pages in Settings
# Settings > Pages > Source: gh-pages

# Result: https://your-username.github.io/stroyklimat
```

### ✅ Option 4: Traditional FTP/HTTP

```bash
# 1. Upload via FTP
ftp your-server.com
> cd public_html
> put -R site/* .

# 2. Or via SCP
scp -r site/* user@server.com:/home/user/public_html

# Result: https://your-domain.com
```

---

## 🎯 Custom Domain Setup

### Vercel
```
1. Go to Project Settings > Domains
2. Add your domain (e.g., stroyklimat.ua)
3. Update DNS records (auto-generated)
4. Wait 24-48 hours for propagation
```

### Netlify
```
1. Go to Site settings > Domain management
2. Add custom domain
3. Update DNS nameservers
```

### Self-Hosted
```
1. Point DNS to your server IP
2. Setup SSL certificate (Let's Encrypt)
   certbot certonly --standalone -d yourdomain.com
3. Configure web server (nginx/Apache)
```

---

## 🔐 HTTPS/SSL

### Vercel & Netlify
✅ Automatic (included)

### Self-Hosted (Let's Encrypt)
```bash
# Install Certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Auto-renew
sudo certbot renew --auto-http01-port 80 --agree-tos --email your@email.com
```

### Nginx Config
```nginx
server {
    listen 443 ssl http2;
    server_name stroyklimat.ua;

    ssl_certificate /etc/letsencrypt/live/stroyklimat.ua/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stroyklimat.ua/privkey.pem;

    root /var/www/stroyklimat/site;
    index index.html;

    # Cache static files
    location ~* \.(js|css|jpg|png|svg|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Always serve index.html for SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 📊 Performance Optimization

### Enable Gzip Compression
```nginx
gzip on;
gzip_types text/html text/css application/javascript;
gzip_min_length 1000;
```

### Cache Headers
```nginx
add_header Cache-Control "max-age=31536000, immutable";
```

### Minify Assets (Optional Build)
```bash
# Using esbuild
npm install -D esbuild

# Create build script
npx esbuild js/*.js --outdir=js --minify --sourcemap=inline
```

### Image Optimization
```bash
# Convert to WebP
npx sharp-cli input.png -o output.webp

# Compress
npx imagemin img/* --out-dir=img
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions (Auto Deploy)
**Create `.github/workflows/deploy.yml`**:

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./site
```

**Setup Secrets**:
```
Go to GitHub Settings > Secrets > Actions
Add: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
```

---

## 📱 PWA Setup (Progressive Web App)

### Create `manifest.json`
```json
{
  "name": "STROYKLIMAT - HVAC Витрина",
  "short_name": "STROYKLIMAT",
  "description": "Каталог вентиляції та кондиціонерів",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#040a12",
  "theme_color": "#2f7de1",
  "icons": [
    {
      "src": "/assets/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Add to `index.html`
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#2f7de1">
<meta name="apple-mobile-web-app-capable" content="yes">
```

---

## 🔍 SEO Optimization

### Sitemap.xml
**Create `sitemap.xml`**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://stroyklimat.ua</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://stroyklimat.ua/catalog.html</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <!-- ... more URLs ... -->
</urlset>
```

### robots.txt
```
User-agent: *
Allow: /
Disallow: /admin.html

Sitemap: https://stroyklimat.ua/sitemap.xml
```

### SEO Meta Tags
Already in `index.html`:
- ✅ Title tags
- ✅ Meta descriptions
- ✅ OpenGraph tags
- ✅ Schema.org markup

### Google Analytics
```html
<!-- Add to <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXX');
</script>
```

---

## 📈 Monitoring & Analytics

### Status Page (UptimeRobot)
```
1. Create account at uptimerobot.com
2. Add monitor: https://stroyklimat.ua
3. Set alert email
```

### Error Tracking (Sentry)
```bash
npm install @sentry/browser

# Add to app.js
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://xxxx@sentry.io/yyyy",
  environment: "production"
});
```

### Performance Monitoring
```javascript
// Add to app.js
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      console.log(`${entry.name}: ${entry.duration}ms`);
    });
  });
  observer.observe({entryTypes: ['measure']});
}
```

---

## 🔧 Environment Setup

### Windows/Mac/Linux
```bash
# Clone repo
git clone https://github.com/stroyklimat/stroyklimat.git
cd stroyklimat

# Install Node.js dependencies
npm install

# Optional: Install Python for local testing
python3 -m http.server 8000

# Open browser
open http://localhost:8000
```

### Docker
**Create `Dockerfile`**:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY site/ .

RUN npm install -g serve

CMD ["serve", "-s", ".", "-l", "3000"]
```

**Build & Run**:
```bash
docker build -t stroyklimat:1.0 .
docker run -p 3000:3000 stroyklimat:1.0
```

---

## 🚨 Troubleshooting

### Site not loading
```bash
# 1. Check DNS
nslookup stroyklimat.ua

# 2. Check SSL
openssl s_client -connect stroyklimat.ua:443

# 3. Check via cURL
curl -I https://stroyklimat.ua
```

### Slow loading
```bash
# Run Lighthouse
npm install -g lighthouse
lighthouse https://stroyklimat.ua --view
```

### CORS issues
```javascript
// Add CORS headers (if backend needed future)
// In nginx:
add_header 'Access-Control-Allow-Origin' '*';
```

### 404 on reload (SPA routing)
```nginx
# Ensure correct nginx config
try_files $uri $uri/ /index.html;
```

---

## ✅ Pre-Launch Checklist

- [ ] Domain registered & pointed
- [ ] SSL certificate installed
- [ ] Catalog data imported (admin.html)
- [ ] Contact info updated (showcase.js)
- [ ] Logo uploaded
- [ ] social media links added
- [ ] Analytics configured
- [ ] Email notifications tested
- [ ] Mobile view tested
- [ ] Dark/light theme tested
- [ ] Showcase mode tested
- [ ] Admin login working (change PIN)
- [ ] Backup created (export catalog.json)

---

## 📞 Support

- **Deployment Help**: GitHub Issues
- **Performance**: Vercel/Netlify Support
- **DNS Issues**: Your domain registrar

---

**Last Updated**: January 2024  
**Version**: 1.0  
