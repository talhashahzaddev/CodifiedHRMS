# CodifiedHRMS - Angular Frontend

A modern, professional HR Management System frontend built with Angular 20, featuring beautiful UI design and responsive layouts.

## 🚀 Project Overview

CodifiedHRMS is a comprehensive HR management platform frontend built with Angular 20. It features a clean, modern SaaS design with light, beautiful color schemes and professional UI components.

## 📋 Features

- **Modern Angular 20** - Built with the latest Angular standalone components
- **Responsive Design** - Fully responsive across desktop, tablet, and mobile
- **Beautiful UI** - Light, professional color scheme with smooth animations
- **Component-Based Architecture** - Reusable, modular components
- **Type-Safe** - Full TypeScript support with interfaces and models
- **Routing** - Clean navigation with Angular Router

## 🛠️ Tech Stack

- **Angular**: 20.3.0
- **TypeScript**: 5.9.2
- **SCSS**: For styling
- **Material Icons**: For icons
- **RxJS**: 7.8.2
- **Zone.js**: 0.15.1

## 📁 Project Structure

```
src/
├── app/
│   ├── core/              # Core services
│   ├── layout/            # Header, Footer components
│   ├── pages/             # Page components
│   │   ├── home/
│   │   ├── features/
│   │   ├── pricing/
│   │   ├── demo-request/
│   │   ├── about/
│   │   └── blog/
│   ├── shared/            # Shared components (Button, Card, etc.)
│   └── models/            # TypeScript interfaces
├── assets/                # Static assets
├── environments/          # Environment configurations
└── styles.scss            # Global styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22.14.0 or higher
- npm 11.2.0 or higher
- Angular CLI 20.3.1

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd CodifiedHRMS
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   # or
   ng serve
   ```

4. **Open your browser** and navigate to:
   ```
   http://localhost:4200
   ```

### Build for Production

```bash
npm run build
# or
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

## 📄 Pages & Routes

- `/` - Home page (Landing)
- `/features` - Features/Modules overview
- `/pricing` - Pricing plans
- `/demo-request` - Demo request form
- `/about` - About Us page
- `/blog` - Blog/Resources listing

## 🎨 Design System

### Color Palette

- **Primary**: Soft blues (#0c8eff, #0071e6)
- **Accent**: Soft purple (#a855f7)
- **Neutrals**: Light grays for backgrounds and text
- **Success**: Green (#10b981)
- **Error**: Red (#ef4444)

### Typography

- **Font Family**: Inter (Google Fonts)
- **Font Sizes**: Responsive scale from 0.75rem to 3rem

### Components

- **Buttons**: Primary, Secondary, Outline, Ghost variants
- **Cards**: Elevated and hoverable variants
- **Forms**: Styled inputs with validation
- **Navigation**: Sticky header with mobile menu

## 🔌 Backend Integration

When you're ready to integrate with a backend:

1. **Update API Service** (`src/app/core/services/api.service.ts`):
   - Replace placeholder API calls with actual endpoints
   - Update `environment.ts` with your API base URL

2. **Demo Request Form**:
   - The form already has validation and structure
   - API call is prepared in `ApiService.submitDemoRequest()`

3. **Blog Posts**:
   - Update `ApiService.getBlogPosts()` with real endpoint
   - Modify `BlogComponent` to fetch from API

4. **Authentication** (if needed):
   - Add auth service in `src/app/core/services/`
   - Create auth guards in `src/app/core/guards/`
   - Update routing with protected routes

### Example API Integration:

```typescript
// In api.service.ts
submitDemoRequest(request: DemoRequest): Observable<any> {
  return this.http.post(`${this.apiUrl}/demo-request`, request);
}
```

## 📝 Development Notes

- All components are **standalone** (Angular 20 style)
- Uses **SCSS** for styling with CSS variables
- **Responsive breakpoints**: Mobile-first approach
- **Form validation**: Reactive forms with custom validators
- **Routing**: Lazy-loaded routes for optimal performance

## 🧪 Testing

```bash
ng test
```

## 📦 Build

```bash
ng build
```

## 🔧 Configuration

- **Environment Variables**: Edit `src/environments/environment.ts`
- **API Base URL**: Update `apiUrl` in environment files
- **Styling**: Global styles in `src/styles.scss`

## 📚 Additional Resources

- [Angular Documentation](https://angular.io/docs)
- [Angular CLI](https://angular.io/cli)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

This is a frontend-only project. Backend integration points are clearly marked in the code with TODO comments.

## 📄 License

This project is proprietary and confidential.

---

**Built with ❤️ using Angular 20**

