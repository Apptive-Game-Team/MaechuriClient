# Design QA

- Source visual truth: `docs/design-reference/flat-case-index.png`
- Implementation screenshot: `docs/design-reference/main-implementation.png`
- Comparison: `docs/design-reference/main-comparison.png`
- Responsive screenshot: `docs/design-reference/main-mobile.png`
- Secondary state: `docs/design-reference/scenario-error.png`
- Viewport: 1440×1024 desktop, 390×844 mobile
- State: light theme, main menu; scenario archive error fallback

**Full-View Comparison Evidence**

- Desktop preserves the reference split composition: fixed dark case index at left, light action surface at right, bottom utility rail.
- Action hierarchy, display typography, vermilion primary accent, ochre secondary accent, and 1px divider rhythm match the selected direction.
- Mobile converts the split layout into a readable vertical flow without clipped actions or overlaying controls.

**Focused Region Comparison Evidence**

- Separate crop was not needed: title, action typography, metadata, dividers, footer, and theme control remain readable in the 1440×1024 full-view comparison.
- Mobile screenshot separately verifies the highest-risk responsive region.

**Findings**

- No actionable P0, P1, or P2 findings remain.
- Backend connection errors appear in the scenario screen because the backend was not running; the UI presents a Korean recovery message.

**Patches Made**

- Fixed light-theme action text contrast.
- Kept the case-intro panel dark across themes.
- Moved the mobile theme control away from primary actions.
- Returned the mobile footer to document flow.
- Prevented Korean headings from breaking by syllable.
- Replaced raw backend error text with an actionable Korean message.

**Implementation Checklist**

- [x] Desktop composition and hierarchy
- [x] Mobile layout and safe control placement
- [x] Keyboard-visible focus
- [x] Reduced-motion fallback
- [x] Korean loading, empty, and error copy
- [x] Modal semantics and Escape close behavior

**Follow-up Polish**

- P3: Replace text-only action affordances with a dedicated icon library if the product later adopts one.

final result: passed
