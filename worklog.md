---
Task ID: 1
Agent: Main Agent
Task: Fix all bugs (visual and functional) in FinTrack app

Work Log:
- Explored entire project structure and read all source files
- Ran Next.js build to identify compilation errors
- Ran TypeScript type check to identify type errors
- Identified and categorized 15+ bugs across the codebase

Stage Summary:
- Found bugs in: transaction-form.tsx, savings-goals.tsx, ai-advisor.tsx, investment-calculator.tsx, fixed-term-calculator.tsx, irpf-calculator.ts, debt-manager.ts, market-service.ts, payment-calendar.ts, types.ts

---
Task ID: 2
Agent: Main Agent
Task: Apply all bug fixes

Work Log:
- Fixed transaction-form.tsx: Changed "Monto ($)" to "Monto (€)"
- Fixed savings-goals.tsx: Changed "Monto objetivo ($)" and "Ya ahorrado ($)" to use €
- Fixed ai-advisor.tsx: Removed broken local cn() function, added proper import from @/lib/utils
- Fixed investment-calculator.tsx: Removed duplicate bottom imports with wrong path (@components instead of @/components), added missing ScrollArea import, fixed lowercase <area-chart> to <AreaChart>, added missing Recharts imports at top
- Fixed fixed-term-calculator.tsx: Removed duplicate bottom imports, fixed lowercase <area-chart> to <AreaChart>, added missing Recharts imports at top
- Fixed irpf-calculator.ts: Changed deductions from ADDED to SUBTRACTED from taxable base (line 419), fixed negative net income producing negative IRPF withholding (line 307), fixed BracketDefinition type to allow null for 'to' field
- Fixed debt-manager.ts: Recovered surplus payment when target debt paid off (was being lost), removed no-op interest adjustment code
- Fixed market-service.ts: Fixed change field set to percentage instead of absolute value, fixed Achmea Bank TIN > TAE data error
- Fixed payment-calendar.ts: Added explicit semestral mapping, fixed day-of-month rollover for months with fewer days, removed dead code (unused futureDate variable)
- Fixed types.ts: Updated IRPFBracket.to to allow number | null
- Verified build succeeds after all fixes

Stage Summary:
- 15+ bugs fixed across 10 files
- All fixes verified with successful Next.js build
- No remaining compilation or TypeScript errors in project files
