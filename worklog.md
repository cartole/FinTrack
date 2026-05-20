---
Task ID: 1
Agent: Main Agent
Task: Comprehensive frontend visual audit and bug fixes for FinTrack app

Work Log:
- Analyzed uploaded screenshot of the app using VLM
- Read all finance component files to identify visual issues
- Completely rewrote subscription-tracker.tsx with improved layout:
  - 2-column grid on desktop (summary + renewals)
  - 2-column grid for AI detection + category breakdown
  - Better mobile responsive design with tighter spacing
  - Added inactive savings banner
  - Improved annual cost breakdown bars
  - Better text truncation and overflow handling
- Changed all cards from `border-0 shadow-sm` to `border shadow-sm` across 16 component files for better visual separation
- Fixed mobile padding on main page (px-3 on mobile, pb-20)
- Fixed debt-manager strategy buttons to stack on small screens
- Fixed investment-calculator ETF card text truncation
- Fixed fixed-term-calculator bank name overflow
- Fixed payment-calendar day cell sizes for mobile (h-10 sm:h-14 lg:h-16)
- Fixed balance-cards mobile grid (grid-cols-2 lg:grid-cols-4)
- Fixed transaction-list text truncation on mobile
- Verified all known bugs from previous sessions are resolved:
  - Month dropdown: already limited to 12 months
  - Sidebar: already scrollable with ScrollArea
  - Banco Sabadell: already in default deposits
  - Euribor 6m and 3m: already fetched with fallbacks
  - Savings goals: already selectable with star button
  - Avalanche vs snowball: logic is correct (different sort orders)

Stage Summary:
- All visual bugs fixed across all finance components
- Build passes successfully
- 16 component files updated with border fixes
- subscription-tracker.tsx completely rewritten with better layout
- Mobile responsiveness improved across all components
