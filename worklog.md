---
Task ID: 1
Agent: Main Agent
Task: Add more configuration functions to FinTrack settings and make savings goals selectable

Work Log:
- Read all key project files to understand current state: settings.tsx, savings-goals.tsx, finance-store.ts, fixed-term-calculator.tsx, dashboard.tsx, sidebar.tsx, debt-manager.tsx, subscription-tracker.tsx, investment-calculator.tsx, payment-calendar.tsx, market-service.ts
- Expanded AppSettings interface in finance-store.ts with 12 new configuration fields across 6 categories
- Completely rewrote settings.tsx with 7 comprehensive sections (was 4)
- Updated savings-goals.tsx to support goal selection with visual indicator
- Updated dashboard.tsx to use global selectedGoalId from settings instead of local state
- Fixed month dropdown infinite growth by limiting to last 12 months
- Verified Euribor 6m and 12m are already present in fixed-term-calculator.tsx
- Verified Banco Sabadell is already in market-service.ts default deposits
- Verified all overflow handling is in place across components
- Build succeeded with no errors

Stage Summary:
- Settings now has: Perfil Personal, Fiscalidad, Economía, Visualización, Notificaciones y Alertas, Metas de Ahorro Activa, Privacidad, Datos, Información
- Savings goals are now selectable with visual ring indicator, star icon, and active banner
- Selected goal is synced globally between Dashboard, Savings Goals, and Settings
- Month dropdown limited to 12 most recent months
