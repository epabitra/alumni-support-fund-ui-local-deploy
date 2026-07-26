# Alumni Student Support Fund UI

React frontend application for Alumni Student Support Fund - A scholarship management system for supporting underprivileged students.

---

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup and configuration guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Quick deployment reference

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Git

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env  # Then edit .env with your API URL

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

---

## 📦 Available Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Build and deploy to GitHub Pages |
| `npm run lint` | Run ESLint |

---

## 🌐 GitHub Pages Deployment

### Quick Deploy

1. **Update configuration:**
   - Edit `vite.config.ts` - Set `REPO_NAME`
   - Edit `package.json` - Set `homepage` URL

2. **Deploy:**
   ```bash
   npm run deploy
   ```

3. **Configure GitHub Pages:**
   - Go to **Settings** → **Pages**
   - Source: **Deploy from a branch**
   - Branch: `gh-pages`
   - Folder: `/ (root)`

### Automatic Deployment

The repository includes GitHub Actions workflow for automatic deployment on push to `main` branch.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 🏗️ Project Structure

```
src/
├── app/
│   ├── modules/
│   │   ├── auth/              # Authentication module
│   │   │   ├── core/          # Auth context, helpers, requests
│   │   │   └── components/    # Login, Register components
│   │   └── scholarship/       # Scholarship module
│   │       ├── core/          # Models and API requests
│   ├── Constants.tsx          # API endpoints & role constants
│   └── useAxiosInterceptor.ts # Axios response interceptor
├── components/                # Reusable components
│   ├── ProtectedRoute.tsx    # Route protection
│   ├── PublicLayout.tsx      # Public page layout
│   └── RoleBasedNav.tsx      # Role-aware navigation
├── pages/                     # Page components
│   ├── admin/                 # Admin pages
│   ├── service-center/       # Service center pages
│   ├── verifier/              # Verifier pages
│   └── [public pages]        # Home, About, etc.
├── styles/                    # CSS files
├── App.tsx                    # Main app component & routing
└── main.tsx                   # Entry point
```

---

## ✨ Features

- ✅ **JWT-based Authentication** - Secure token-based auth
- ✅ **Role-Based Access Control** - Admin, Verifier, Service Center, Auditor roles
- ✅ **Protected Routes** - Route-level security
- ✅ **Form Validation** - Formik + Yup integration
- ✅ **Axios Interceptors** - Automatic token handling
- ✅ **TypeScript** - Full type safety
- ✅ **Responsive Design** - Mobile-friendly UI
- ✅ **GitHub Pages Ready** - Pre-configured for deployment

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file:

```env
# Backend API URL
VITE_APP_API_URL=http://localhost:8080/api

# Application URL (for local development)
VITE_APP_URL=http://localhost:5173
```

### Repository Configuration

Before deploying, update:

1. **`vite.config.ts`** - Set `REPO_NAME` constant
2. **`package.json`** - Set `homepage` field

---

## 🔐 Security

- Environment variables are not committed (see `.gitignore`)
- JWT tokens stored securely
- CORS configured for API calls
- HTTPS enforced on GitHub Pages

---

## 🛠️ Development

### Adding New Pages

1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link if needed

### API Integration

API endpoints are defined in `src/app/Constants.tsx`. Use the request functions from `src/app/modules/scholarship/core/_requests.ts`.

---

## 📝 License

This project is part of the Alumni Student Support Fund initiative.---## 🆘 SupportFor setup issues, see [SETUP.md](./SETUP.md)  
For deployment help, see [DEPLOYMENT.md](./DEPLOYMENT.md)---**Built with:** React 18, TypeScript, Vite, React Router, Axios, Formik, Yup