# MuleCube Dashboard

<p align="center">
  <img src="https://mulecube.com/images/logo.png" alt="MuleCube" width="120">
</p>

<p align="center">
  <strong>Device web interface for MuleCube offline knowledge servers.</strong><br>
  A Hugo-based dashboard providing system stats, service access, and device management.
</p>

<p align="center">
  <a href="https://demo.mulecube.com">Live Demo</a> •
  <a href="https://mulecube.com">Website</a> •
  <a href="https://mulecube.com/docs/">Documentation</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/framework-Hugo-ff4088?style=flat-square" alt="Hugo">
  <img src="https://img.shields.io/badge/css-Pico%20CSS-1095c1?style=flat-square" alt="Pico CSS">
  <img src="https://img.shields.io/badge/license-GPL--3.0-green?style=flat-square" alt="License">
</p>

---

## Related Repositories

| Repository | Description |
|------------|-------------|
| [mulecube-os](https://github.com/nuclearlighters/mulecube-os) | Core OS, Docker services, and device configuration |
| [mulecube-dashboard](https://github.com/nuclearlighters/mulecube-dashboard) | Hugo-based web dashboard for the device (this repo) |

---

## Features

- **Dark/Light Theme** — Auto-detects system preference, manual toggle with localStorage persistence
- **Live System Stats** — CPU, memory, disk, network status updated every 5 seconds
- **Service Status** — Automatic health checks for all services (every 30 seconds)
- **Hero Slideshow** — Rotating background images showcasing use cases
- **Responsive Design** — Works on phones, tablets, and desktops
- **100% Offline** — No external dependencies after build
- **Demo Mode** — Public demo site shows simulated stats with clear "Demo" banner

---

## Dual Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ghcr.io/nuclearlighters/mulecube/                    │
│                          mulecube-dashboard                              │
├─────────────────────────────────┬───────────────────────────────────────┤
│         :demo tag               │         :v1.0.0 / :latest             │
│   (demo.mulecube.com)           │       (mulecube.local)                │
├─────────────────────────────────┼───────────────────────────────────────┤
│  Demo banner visible            │  Clean production build               │
│  Simulated stats (fluctuate)    │  Real stats from /stats.json          │
│  All services "simulated"       │  Actual service health checks         │
│  Links to mulecube.com/products │  Fully functional dashboard           │
│  Deployed on every main push    │  Deployed on version tags             │
└─────────────────────────────────┴───────────────────────────────────────┘
```

---

## Project Structure

```
www/
├── .gitlab-ci.yml              # Pipeline: build, docker, deploy
├── hugo.yaml                   # Main Hugo config with service definitions
├── config/
│   └── demo/
│       └── hugo.yaml           # Demo environment overrides (demoMode: true)
├── content/
│   └── _index.md               # Homepage content
├── layouts/
│   ├── _default/baseof.html    # Base template (includes demo mode meta tag)
│   ├── index.html              # Homepage layout
│   └── partials/
│       ├── header.html         # Navigation + theme toggle
│       ├── footer.html         # Site footer
│       ├── stats-bar.html      # System stats display
│       ├── logo-svg.html       # MuleCube logo
│       └── service-category.html
└── static/
    ├── css/
    │   ├── pico.min.css        # Pico CSS v2.1.1
    │   └── dashboard.css       # MuleCube styles + demo mode
    ├── js/
    │   └── dashboard.js        # Theme, stats, status (device + demo modes)
    └── images/
        └── hero/               # Slideshow backgrounds
```

---

## Local Development

```bash
# Normal build (device mode)
hugo server -D

# Demo mode build
hugo server -D -e demo

# Production build
hugo --minify --gc --ignoreCache

# Demo build
hugo --minify --gc --ignoreCache -e demo
```

## Adding Services

Services are configured in `hugo.yaml` under `params.services`:

```yaml
params:
  services:
    category_name:
      title: "Category Title"
      items:
        - name: Service Name
          url: "http://service.mulecube.local"
          description: "Short description"
          service: service-id
          icon: "https://example.com/favicon.ico"
          fallback: "S"
          gradient: "#color1, #color2"
```

## Images Required

Copy from the main mulecube.com repo:

```bash
cp -r ../mulecube.com/www/static/images/hero static/images/
cp ../mulecube.com/www/static/images/product-base.png static/images/
cp ../mulecube.com/www/static/favicon-*.png static/images/
```

---

## CI/CD Pipeline

| Trigger | Build | Docker Tag | Deploy Target |
|---------|-------|------------|---------------|
| Push to `main` | `hugo -e demo` | `:demo` | demo.mulecube.com (DMZ) |
| Tag `v1.0.0` | `hugo` | `:v1.0.0`, `:latest` | mulecube.local (Pi) |

### Required CI/CD Variables

| Variable | Description |
|----------|-------------|
| `GHCR_USER` | GitHub Container Registry username |
| `GHCR_TOKEN` | GitHub Container Registry token |
| `AWX_TOKEN` | AWX API authentication token |
| `AWX_DEMO_TEMPLATE_ID` | AWX job template ID for DMZ deployment |
| `AWX_DEVICE_TEMPLATE_ID` | AWX job template ID for device deployment |

---

## Demo Mode Behavior

When built with `-e demo`:

- Purple banner at top: "Demo Mode - This is a preview"
- Stats show simulated values that fluctuate realistically
- All services show as "online" (simulated)
- Status banner shows "All X services simulated"
- CTA button links to mulecube.com/products

When `stats.json` is unavailable (fallback demo):

- Automatically switches to demo mode
- Same behavior as explicit demo build

---

## Release Process

```bash
# 1. Test locally
hugo server -D

# 2. Commit and push (deploys demo)
git add .
git commit -m "Update dashboard"
git push origin main

# 3. When ready for device release
git tag v1.0.0
git push origin v1.0.0
# This deploys to the Raspberry Pi
```

---

## Integration with MuleCube OS

The dashboard is designed to be deployed alongside the [MuleCube OS](https://github.com/nuclearlighters/mulecube-os). When using the OS one-line installer, the dashboard is included automatically.

For manual integration:

```bash
# Clone into the MuleCube deployment directory
git clone https://github.com/nuclearlighters/mulecube-dashboard.git /srv/mulecube-dashboard

# Build the static site
cd /srv/mulecube-dashboard
hugo --minify

# The nginx configuration in mulecube-os serves it at the root URL
```

The dashboard reads system stats from `/stats.json`, generated by the `hw-monitor` service in the OS repo.

---

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

---

## Links

| Resource | URL |
|----------|-----|
| Live Demo | [demo.mulecube.com](https://demo.mulecube.com) |
| Website | [mulecube.com](https://mulecube.com) |
| Documentation | [mulecube.com/docs](https://mulecube.com/docs/) |
| GitLab (primary) | [gitlab.nuclearlighters.net](https://gitlab.nuclearlighters.net/websites/mulecube.net/dashboard) |

---

<p align="center">
  Built in the Netherlands by <a href="https://nuclearlighters.net">Nuclear Lighters Inc.</a>
</p>