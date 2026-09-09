# UI Design Contract — Issue #59

**Date**: 2026-09-08 | **Scope**: Frontend redesign per Claude Design Guidelines

## Token System

File: `frontend/src/theme.css` — imported once in `main.tsx`.

All structural styles reference these CSS custom properties. Inline `style={{}}` only for
computed/dynamic values (e.g., status-driven badge color).

### Color Tokens (light mode)

```css
:root {
  /* Backgrounds */
  --color-background-primary:   #FFFFFF;
  --color-background-secondary: #F5F4ED;
  --color-background-tertiary:  #FAF9F5;
  --color-background-inverse:   #141413;

  /* Semantic backgrounds */
  --color-background-success: #E9F1DC;
  --color-background-danger:  #F7ECEC;
  --color-background-warning: #F6EEDF;
  --color-background-info:    #D6E4F6;

  /* Text */
  --color-text-primary:   #141413;
  --color-text-secondary: #3D3D3A;
  --color-text-tertiary:  #73726C;
  --color-text-inverse:   #FFFFFF;

  /* Semantic text */
  --color-text-success: #265B19;
  --color-text-danger:  #7F2C28;
  --color-text-warning: #5A4815;
  --color-text-info:    #3266AD;

  /* Borders */
  --color-border-primary:   rgba(31, 30, 29, 0.4);
  --color-border-secondary: rgba(31, 30, 29, 0.3);
  --color-border-tertiary:  rgba(31, 30, 29, 0.15);

  /* Semantic borders */
  --color-border-success: #437426;
  --color-border-danger:  #A73D39;
  --color-border-warning: #805C1F;

  /* Typography */
  --font-sans: "Anthropic Sans", system-ui, sans-serif;
  --font-mono: ui-monospace, monospace;
  --font-weight-normal:   400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;
  --font-text-xs-size: 12px;
  --font-text-sm-size: 14px;
  --font-text-md-size: 16px;
  --font-text-lg-size: 20px;
  --font-heading-lg-size:  20px;
  --font-heading-xl-size:  24px;
  --font-heading-2xl-size: 28px;
  --font-text-sm-line-height: 1.4;
  --font-text-md-line-height: 1.4;
  --font-heading-lg-line-height: 1.25;

  /* Radius */
  --border-radius-xs:   4px;
  --border-radius-sm:   6px;
  --border-radius-md:   8px;
  --border-radius-lg:   10px;
  --border-radius-xl:   12px;
  --border-radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
}
/* TODO: add @media (prefers-color-scheme: dark) overrides when dark mode is required */
```

## Shared Component Classes

Defined in each component's co-located `styles.css`.

### Buttons

```css
.btn-primary   /* inverse bg, white text, 8px radius, 600 weight */
.btn-secondary /* secondary bg, primary text, border, 8px radius */
.btn-danger    /* danger bg, danger text, danger border */
```

### Cards

```css
.card          /* white bg, border-tertiary, 8px radius, shadow-sm, padding 24px */
.card-section  /* secondary bg, border-tertiary, 8px radius, padding 16px */
```

### Status Badges

```css
.badge                     /* base: pill shape, sm text, 500 weight, padding 2px 8px */
.badge-approved            /* success bg/text */
.badge-auto_approved       /* success bg/text */
.badge-pending_review      /* warning bg/text */
.badge-rejected            /* danger bg/text */
.badge-flagged             /* danger bg/text */
.badge-under_investigation /* info bg/text */
.badge-cleared             /* secondary bg, tertiary text */
```

### Form Elements

```css
.form-group    /* margin-bottom 16px */
.form-label    /* sm text, medium weight, secondary text color, margin-bottom 6px */
.form-input    /* full width, md text, border-primary, 8px radius, padding 8px 12px */
.form-select   /* same as form-input */
.form-error    /* danger text, xs text, margin-top 4px */
.form-hint     /* tertiary text, xs text, margin-top 4px */
```

### Layout

```css
.page-container  /* max-width 960px, margin 0 auto, padding 32px 24px */
.page-header     /* heading-lg, 700 weight, margin-bottom 24px */
.data-table      /* full width, border-collapse, border-tertiary rows */
.data-table th   /* sm text, semibold, secondary text, secondary bg, padding 10px 16px */
.data-table td   /* md text, primary text, padding 12px 16px, border-bottom tertiary */
```

## Page-by-Page Requirements

| Page | Layout | Key elements |
|---|---|---|
| `AppLayout` header | Full-width, inverse bg (`#141413`), height 56px | Logo (white), user chip (white, sm), sign-out btn |
| `LoginPage` | Centered card, max-width 480px, page bg | JWT textarea, primary btn, demo user list (secondary btns) |
| `SubmitClaimPage` | `page-container`, single `.card` | All form fields use `.form-*` classes; result uses `.badge-*` |
| `ReviewQueuePage` | `page-container`, `.data-table` | Status badge per row, clickable rows |
| `ClaimDetailPage` | `page-container`, `.card` | Policy flags as `.badge-flagged`, approve (primary) / reject (danger) btns |
| `AuditDashboardPage` | `page-container`, `.data-table` | Violation type badge, investigate/clear action btns |
| `AuditClaimDetailPage` | `page-container`, `.card` | Flag list with status badges, action buttons |
| `PolicyConfigPage` | `page-container`, `.data-table` or cards | Editable inputs inline, save primary btn |
| `NotificationBell` | Absolute-positioned dropdown `.card` | Unread count as danger pill badge |

## Acceptance Criteria

1. `frontend/src/theme.css` exists and is imported in `main.tsx`
2. No component uses hardcoded hex colors outside of `theme.css`  
3. All structural styles are CSS classes (no inline `style={{}}` for color/font/spacing)
4. Status badges use correct semantic color pairs from the token table
5. Header uses `--color-background-inverse` (`#141413`), not blue
6. Body uses `--color-background-tertiary` (`#FAF9F5`) as page background
7. All buttons meet 44×44pt minimum touch target
8. `npm run build` passes with no TypeScript errors
