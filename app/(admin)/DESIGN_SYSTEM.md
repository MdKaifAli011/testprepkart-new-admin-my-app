# Admin Panel Design System

A comprehensive design system inspired by ChatGPT, Linear, and Vercel's clean, modern, and professional UI aesthetic.

## 🎨 Design Philosophy

- **Clean & Minimal**: Reduce visual noise, focus on content
- **Spacious**: Generous whitespace for breathing room
- **Consistent**: Unified patterns across all components
- **Readable**: Clear typography hierarchy and contrast
- **Professional**: Modern, polished, and trustworthy

---

## 📐 Typography Hierarchy

### Font Family
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
```

### Font Sizes & Weights

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| **H1** | `text-3xl` (30px) | `font-semibold` (600) | `leading-tight` | Page titles, main headings |
| **H2** | `text-2xl` (24px) | `font-semibold` (600) | `leading-tight` | Section titles, card headers |
| **H3** | `text-xl` (20px) | `font-semibold` (600) | `leading-normal` | Subsection titles |
| **H4** | `text-lg` (18px) | `font-medium` (500) | `leading-normal` | Card titles, list headers |
| **Body Large** | `text-base` (16px) | `font-normal` (400) | `leading-relaxed` | Primary body text |
| **Body** | `text-sm` (14px) | `font-normal` (400) | `leading-relaxed` | Secondary text, descriptions |
| **Body Small** | `text-xs` (12px) | `font-normal` (400) | `leading-normal` | Captions, labels, metadata |
| **Button** | `text-sm` (14px) | `font-medium` (500) | `leading-none` | Button text |
| **Label** | `text-sm` (14px) | `font-medium` (500) | `leading-normal` | Form labels |

### Typography Rules
- ✅ Use semantic HTML (`h1`, `h2`, `p`, etc.)
- ✅ Maximum 75 characters per line for optimal readability
- ✅ Consistent text color: `text-gray-900` for headings, `text-gray-600` for body
- ✅ No more than 2-3 font sizes per component
- ❌ Avoid mixing too many font weights in one section

---

## 🎨 Color Palette

### Primary Colors
```css
/* Primary Blue - Main actions, links, active states */
--color-primary-50: #eff6ff;
--color-primary-100: #dbeafe;
--color-primary-500: #3b82f6;  /* Base blue */
--color-primary-600: #2563eb;  /* Hover state */
--color-primary-700: #1d4ed8;  /* Active/pressed */
```

### Neutral Colors (Primary Palette)
```css
/* Grays - Text, backgrounds, borders */
--color-gray-50: #f9fafb;   /* Backgrounds */
--color-gray-100: #f3f4f6;  /* Subtle backgrounds */
--color-gray-200: #e5e7eb;  /* Borders */
--color-gray-300: #d1d5db;  /* Disabled borders */
--color-gray-400: #9ca3af;  /* Placeholder text */
--color-gray-500: #6b7280;  /* Secondary text */
--color-gray-600: #4b5563;  /* Body text */
--color-gray-700: #374151;  /* Dark text */
--color-gray-900: #111827;  /* Headings */
```

### Semantic Colors (Use Sparingly)
```css
/* Success - Green */
--color-success-50: #f0fdf4;
--color-success-500: #22c55e;
--color-success-600: #16a34a;

/* Error - Red */
--color-error-50: #fef2f2;
--color-error-500: #ef4444;
--color-error-600: #dc2626;

/* Warning - Amber */
--color-warning-50: #fffbeb;
--color-warning-500: #f59e0b;
--color-warning-600: #d97706;
```

### Color Usage Rules
- ✅ **Primary**: Use blue (`blue-600`) for primary actions, active states, links
- ✅ **Neutral**: Use grays for text, backgrounds, and borders (90% of UI)
- ✅ **Semantic**: Only use green/red/amber for status indicators, success/error states
- ❌ **Avoid**: Multiple colors in one section (max 2-3 colors per component)
- ❌ **Avoid**: Bright, saturated colors except for specific status indicators

---

## 📏 Spacing Scale

### Base Unit: 4px (0.25rem)

| Token | Size | Usage |
|-------|------|-------|
| `space-1` | 4px | Tight spacing (icons, badges) |
| `space-2` | 8px | Small gaps (form elements) |
| `space-3` | 12px | Default small spacing |
| `space-4` | 16px | **Default spacing** (most common) |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Large section spacing |
| `space-12` | 48px | Extra large spacing |
| `space-16` | 64px | Hero spacing |

### Spacing Rules
- ✅ Use consistent spacing: `space-y-6` for vertical sections, `gap-4` for grids
- ✅ Padding: `p-6` for cards, `p-4` for compact cards
- ✅ Margins: `mb-6` between sections, `mb-4` between related items
- ✅ Container padding: `px-6` horizontal, `py-8` for page sections
- ❌ Avoid: Mixing different spacing values unnecessarily (e.g., `p-5`, `p-7`)

---

## 🔲 Border Radius

| Token | Size | Usage |
|-------|------|-------|
| `rounded-sm` | 2px | Inputs, small elements |
| `rounded-md` | 6px | Buttons, badges |
| `rounded-lg` | 8px | **Default** (cards, buttons, inputs) |
| `rounded-xl` | 12px | Large cards, modals |
| `rounded-2xl` | 16px | Hero sections, special cards |

### Border Radius Rules
- ✅ Use `rounded-lg` as the default for most components
- ✅ Use `rounded-xl` for larger cards and containers
- ❌ Avoid: Mixing many different border radius values

---

## 🌑 Shadows

```css
/* Subtle shadows - Linear/Vercel style */
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);      /* Cards, inputs */
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);    /* Hover states */
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);  /* Modals, dropdowns */
```

### Shadow Rules
- ✅ Use `shadow-sm` for cards by default
- ✅ Use `shadow-md` on hover for interactive cards
- ✅ Use `shadow-lg` for modals and elevated elements
- ❌ Avoid: Heavy shadows (`shadow-xl`, `shadow-2xl`) except for special cases

---

## 📦 Component Patterns

### Cards
```jsx
<div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
  {/* Content */}
</div>
```

**Rules:**
- Background: `bg-white`
- Border: `border border-gray-200`
- Padding: `p-6` (standard), `p-4` (compact)
- Shadow: `shadow-sm` (default), `shadow-md` (hover)
- Border radius: `rounded-lg`

---

### Buttons

#### Primary Button
```jsx
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
  Button Text
</button>
```

#### Secondary Button
```jsx
<button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm font-medium transition-colors">
  Button Text
</button>
```

**Rules:**
- Padding: `px-4 py-2` (standard), `px-3 py-1.5` (small)
- Font: `text-sm font-medium`
- Border radius: `rounded-lg`
- Always include `transition-colors` for smooth hover

---

### Forms

#### Input Field
```jsx
<input 
  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
             text-sm placeholder-gray-400 transition-all"
/>
```

**Rules:**
- Padding: `px-4 py-2.5`
- Border: `border-gray-300`, focus: `ring-2 ring-blue-500`
- Placeholder: `placeholder-gray-400`
- Always include focus states

---

### Tables

```jsx
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Header
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        Content
      </td>
    </tr>
  </tbody>
</table>
```

**Rules:**
- Header: `bg-gray-50`, `text-xs font-medium text-gray-500 uppercase`
- Rows: `hover:bg-gray-50` for interactivity
- Padding: `px-6 py-4` for cells
- Dividers: `divide-y divide-gray-200`

---

### Badges/Status

```jsx
<span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Active
</span>
```

**Rules:**
- Padding: `px-2.5 py-1`
- Border radius: `rounded-full`
- Font: `text-xs font-medium`
- Use semantic colors sparingly

---

## 📱 Layout Structure

### Page Container
```jsx
<div className="min-h-screen bg-gray-50">
  {/* Header */}
  {/* Sidebar */}
  <main className="pt-16 lg:ml-64 lg:pt-16 px-6 py-8">
    <div className="max-w-7xl mx-auto">
      {/* Content */}
    </div>
  </main>
</div>
```

### Section Spacing
```jsx
<div className="space-y-8">
  {/* Section 1 */}
  <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
    {/* Content */}
  </section>
  
  {/* Section 2 */}
  <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
    {/* Content */}
  </section>
</div>
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: `< 640px` (default)
- **Tablet**: `sm: 640px`, `md: 768px`
- **Desktop**: `lg: 1024px`, `xl: 1280px`

### Responsive Rules
- ✅ Mobile-first approach
- ✅ Stack columns on mobile: `flex-col md:flex-row`
- ✅ Adjust padding: `p-4 md:p-6 lg:p-8`
- ✅ Adjust text sizes: `text-base md:text-lg`
- ✅ Hide/show elements: `hidden md:block`

---

## ✅ UI Cleanup Checklist

### Typography
- [ ] Replace all inconsistent text sizes with design system tokens
- [ ] Standardize font weights (use `font-medium` or `font-semibold`, avoid `font-bold`)
- [ ] Ensure consistent line heights
- [ ] Remove unnecessary text color variations

### Colors
- [ ] Replace all colored backgrounds with grays (except status indicators)
- [ ] Standardize primary color to `blue-600`
- [ ] Remove excessive color variations (purple, indigo, yellow, pink backgrounds)
- [ ] Use semantic colors only for status (green/red/amber)

### Spacing
- [ ] Replace `p-5`, `p-7`, `p-10` with standard values (`p-4`, `p-6`, `p-8`)
- [ ] Standardize vertical spacing: `space-y-6` for sections
- [ ] Consistent padding: `p-6` for cards, `p-4` for compact
- [ ] Remove inconsistent gaps (`gap-2`, `gap-3`, `gap-5` → use `gap-4`)

### Borders & Shadows
- [ ] Standardize border radius: `rounded-lg` (default), `rounded-xl` (large)
- [ ] Use `shadow-sm` for cards, `shadow-md` for hover
- [ ] Consistent border colors: `border-gray-200`

### Components
- [ ] Cards: `bg-white rounded-lg border border-gray-200 p-6 shadow-sm`
- [ ] Buttons: Standard padding and font sizes
- [ ] Forms: Consistent input styling
- [ ] Tables: Standard header and row styling

### Layout
- [ ] Consistent page padding: `px-6 py-8`
- [ ] Standard section spacing: `space-y-8`
- [ ] Align all elements to grid (no random positioning)

---

## 🎯 Implementation Priority

1. **Phase 1**: Update design tokens (colors, spacing, typography)
2. **Phase 2**: Refactor layout components (Header, Sidebar, MainLayout)
3. **Phase 3**: Update dashboard and management pages
4. **Phase 4**: Refactor tables and forms
5. **Phase 5**: Final polish and consistency check

---

## 📚 Reference

Inspired by:
- **ChatGPT**: Clean, minimal, excellent readability
- **Linear**: Perfect spacing and typography
- **Vercel**: Modern, professional aesthetic

---

## 🔧 Tailwind Config

See `tailwind.config.js` for custom design tokens and theme configuration.

