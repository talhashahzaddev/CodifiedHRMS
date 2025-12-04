# CodifiedHRMS - Angular Project Structure

```
CodifiedHRMS/
├── angular.json                 # Angular CLI configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── tsconfig.app.json           # App-specific TS config
├── tsconfig.spec.json          # Test TS config
├── .editorconfig               # Editor configuration
├── .gitignore                  # Git ignore rules
├── README.md                   # Project documentation
│
├── src/
│   ├── index.html              # Main HTML entry point
│   ├── main.ts                 # Application bootstrap
│   ├── styles.scss             # Global styles
│   │
│   ├── app/
│   │   ├── app.config.ts       # App configuration (standalone)
│   │   ├── app.component.ts    # Root component
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   ├── app.routes.ts       # Routing configuration
│   │   │
│   │   ├── core/               # Core services and singleton services
│   │   │   ├── services/
│   │   │   │   └── api.service.ts
│   │   │   └── guards/
│   │   │
│   │   ├── shared/             # Shared modules/components
│   │   │   ├── components/
│   │   │   │   ├── button/
│   │   │   │   │   ├── button.component.ts
│   │   │   │   │   ├── button.component.html
│   │   │   │   │   └── button.component.scss
│   │   │   │   ├── card/
│   │   │   │   │   ├── card.component.ts
│   │   │   │   │   ├── card.component.html
│   │   │   │   │   └── card.component.scss
│   │   │   │   ├── hero/
│   │   │   │   │   ├── hero.component.ts
│   │   │   │   │   ├── hero.component.html
│   │   │   │   │   └── hero.component.scss
│   │   │   │   └── input-field/
│   │   │   │       ├── input-field.component.ts
│   │   │   │       ├── input-field.component.html
│   │   │   │       └── input-field.component.scss
│   │   │   ├── directives/
│   │   │   └── pipes/
│   │   │
│   │   ├── layout/             # Layout components
│   │   │   ├── header/
│   │   │   │   ├── header.component.ts
│   │   │   │   ├── header.component.html
│   │   │   │   └── header.component.scss
│   │   │   ├── footer/
│   │   │   │   ├── footer.component.ts
│   │   │   │   ├── footer.component.html
│   │   │   │   └── footer.component.scss
│   │   │   └── main-layout/
│   │   │       ├── main-layout.component.ts
│   │   │       ├── main-layout.component.html
│   │   │       └── main-layout.component.scss
│   │   │
│   │   ├── pages/              # Page components
│   │   │   ├── home/
│   │   │   │   ├── home.component.ts
│   │   │   │   ├── home.component.html
│   │   │   │   └── home.component.scss
│   │   │   ├── features/
│   │   │   │   ├── features.component.ts
│   │   │   │   ├── features.component.html
│   │   │   │   └── features.component.scss
│   │   │   ├── pricing/
│   │   │   │   ├── pricing.component.ts
│   │   │   │   ├── pricing.component.html
│   │   │   │   └── pricing.component.scss
│   │   │   ├── demo-request/
│   │   │   │   ├── demo-request.component.ts
│   │   │   │   ├── demo-request.component.html
│   │   │   │   └── demo-request.component.scss
│   │   │   ├── about/
│   │   │   │   ├── about.component.ts
│   │   │   │   ├── about.component.html
│   │   │   │   └── about.component.scss
│   │   │   └── blog/
│   │   │       ├── blog.component.ts
│   │   │       ├── blog.component.html
│   │   │       └── blog.component.scss
│   │   │
│   │   └── models/             # TypeScript interfaces/models
│   │       ├── pricing.model.ts
│   │       ├── feature.model.ts
│   │       └── demo-request.model.ts
│   │
│   ├── assets/                 # Static assets
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   └── environments/           # Environment configurations
│       ├── environment.ts
│       └── environment.prod.ts
│
└── node_modules/               # Dependencies (generated)
```

## Key Design Decisions:

1. **Standalone Components**: Using Angular standalone components (Angular 20 style)
2. **SCSS**: Using SCSS for styling with beautiful light color palette
3. **Modular Structure**: Clear separation between pages, shared components, and layout
4. **Responsive Design**: Mobile-first approach with breakpoints
5. **Type Safety**: TypeScript interfaces for all data models
6. **Routing**: Centralized routing in `app.routes.ts`

