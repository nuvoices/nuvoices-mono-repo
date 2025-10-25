# NuVoices Mobile Responsiveness Fixes

**Date Created:** 2025-10-25
**Status:** Planning Phase
**Priority:** High

## Overview

This document outlines all mobile responsiveness issues identified in the NuVoices website and provides a prioritized roadmap for fixing them. The site currently uses fixed widths and absolute positioning that breaks on mobile devices.

---

## Critical Issues (Priority 1) - Must Fix First

### 1. **Grid System - Article Cards Not Responsive**
**Location:** `src/components/ui/grid/Grid.tsx` (GridRow component)
**Current State:**
```tsx
<div className={`flex gap-[0.313rem] justify-center ${className}`}>
```

**Problem:**
- Uses `flex` without wrapping
- All articles display in a single row
- On mobile, cards overflow horizontally or become impossibly small
- No responsive grid breakpoints

**Solution:**
- Mobile (< 768px): 1 column (100% width)
- Tablet (768px - 1024px): 2 columns
- Desktop (> 1024px): 3 columns max

**Fix:**
```tsx
<div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[0.313rem] ${className}`}>
```

**Impact:** Magazine, Podcast, and News sections on homepage + all listing pages

---

### 2. **Inconsistent Content Width Across Pages**
**Location:** Multiple page files
**Current State:**
- Homepage: `max-w-[45rem]` (720px)
- Directory: `max-w-[35.71875rem]` (571px)
- About: `max-w-[25rem]` (400px)

**Problem:**
- No unified responsive width strategy
- Fixed max-widths don't account for mobile
- Content touches screen edges on mobile
- Inconsistent user experience

**Solution:**
Create a unified container system:
```tsx
// Mobile: 100% width with padding
// Tablet: 90% width
// Desktop: Fixed max-width (45rem)

className="w-full px-4 sm:px-6 md:px-8 max-w-[45rem] mx-auto"
```

**Pages to Update:**
- `/` (homepage)
- `/about`
- `/directory`
- `/magazine/[slug]`
- `/podcast/[slug]`
- `/news/[slug]`

---

### 3. **Header Navigation Not Mobile-Friendly**
**Location:** `src/components/Header.tsx`
**Current State:**
- Absolute positioning: `absolute right-[1.875rem]`
- 5 navigation links in horizontal row
- Fixed font size: `text-[0.688rem]`
- No mobile menu/hamburger

**Problem:**
- Navigation overflows on screens < 600px
- Links become unclickable when squished
- Social icons overlap with logo
- No mobile menu pattern

**Solution:**
1. Implement hamburger menu for mobile
2. Use responsive positioning:
   ```tsx
   // Desktop: Horizontal nav
   <nav className="hidden md:flex gap-[1.25rem]">

   // Mobile: Hamburger menu
   <button className="md:hidden">☰</button>
   ```

**Recommended Library:** shadcn/ui Sheet component (already installed)

---

## High Priority (Priority 2) - Fix Second

### 4. **Footer Breaks on Mobile**
**Location:** `src/components/Footer.tsx`
**Current State:**
```tsx
<p className="absolute left-[1.906rem] top-[2.063rem] ... w-[41.25rem]">
```

**Problem:**
- Fixed width `w-[41.25rem]` (660px) overflows on mobile
- Absolute positioning doesn't adapt
- Text will be cut off on screens < 660px wide
- Footer navigation in single row

**Solution:**
```tsx
// Stack elements vertically on mobile
<footer className="bg-[#dd9ca1] py-8 px-4 sm:px-6">
  <div className="max-w-[45rem] mx-auto flex flex-col lg:flex-row gap-6">
    <p className="flex-1 text-base sm:text-lg">...</p>
    <nav className="flex flex-wrap gap-4 justify-center lg:justify-end">
      ...
    </nav>
  </div>
</footer>
```

---

### 5. **Homepage Hero - Buttons Don't Wrap**
**Location:** `src/app/page.tsx` (lines 147-157)
**Current State:**
```tsx
<div className="flex gap-[0.938rem]">
  {/* JOIN, DONATE, EXPLORE buttons */}
</div>
```

**Problem:**
- 3 buttons at ~126px each = 378px minimum
- No wrapping on small screens (< 400px)
- Buttons shrink or overflow

**Solution:**
```tsx
<div className="flex flex-wrap gap-[0.938rem] justify-center">
  {/* Buttons wrap to new row on small screens */}
</div>
```

---

### 6. **Typography Not Responsive**
**Location:** All pages
**Current State:**
- All text sizes are fixed in rem units
- Hero tagline: `text-[3.438rem]` (55px) - too large for mobile
- No responsive text scaling

**Problem:**
- Large headings overflow or cause horizontal scroll
- Poor readability on small screens
- Inconsistent visual hierarchy

**Solution:**
Use Tailwind's responsive typography:
```tsx
// Hero tagline
className="text-2xl sm:text-3xl md:text-4xl lg:text-[3.438rem]"

// Page titles
className="text-xl sm:text-2xl md:text-3xl lg:text-[2.5rem]"

// Body text
className="text-sm sm:text-base"
```

**Critical Text to Fix:**
- Homepage hero tagline (currently 55px)
- All h1 headings
- Featured post titles
- Article titles in grids

---

## Medium Priority (Priority 3) - Fix Third

### 7. **Homepage Featured Image Fixed Height**
**Location:** `src/app/page.tsx` (line 169)
**Current State:**
```tsx
<div className="h-[18.75rem] w-full relative">
```

**Problem:**
- Fixed height of 300px
- Image may be cropped oddly on mobile
- Doesn't maintain aspect ratio

**Solution:**
```tsx
<div className="aspect-video w-full relative">
  <img ... className="w-full h-full object-cover" />
</div>
```

---

### 8. **About Page Text Justification**
**Location:** `src/app/about/page.tsx` (line 20)
**Current State:**
```tsx
<p className="... text-justify">
```

**Problem:**
- `text-justify` creates uneven spacing on mobile
- Harder to read on narrow screens

**Solution:**
```tsx
<p className="... text-left sm:text-justify">
```

---

### 9. **Header Social Icons Too Small on Mobile**
**Location:** `src/components/Header.tsx`
**Current State:**
- Icon sizes: `w-[0.844rem]` (~13.5px)
- Difficult to tap on mobile (< 44px minimum)

**Problem:**
- Touch targets too small (iOS/Android recommend 44x44px minimum)
- Poor accessibility

**Solution:**
```tsx
<a className="w-8 h-8 sm:w-[0.844rem] sm:h-[0.844rem] flex items-center justify-center">
  <img className="w-full h-full" />
</a>
```

---

### 10. **Directory Page Excessive Padding on Mobile**
**Location:** `src/app/directory/page.tsx`
**Current State:**
```tsx
<main className="max-w-[35.71875rem] mx-auto px-[1.875rem] py-[3rem]">
```

**Problem:**
- 30px horizontal padding is too much on narrow screens
- Reduces usable content area

**Solution:**
```tsx
<main className="max-w-[35.71875rem] mx-auto px-4 sm:px-6 md:px-[1.875rem] py-8 md:py-[3rem]">
```

---

## Low Priority (Priority 4) - Nice to Have

### 11. **Add Padding to Prevent Content Edge Collision**
**All Pages**

Ensure all full-width containers have mobile padding:
```tsx
className="px-4 sm:px-6 md:px-8"
```

---

### 12. **Optimize Logo Sizing for Mobile**
**Location:** Homepage logo
**Current:**
```tsx
<div className="w-[8.438rem] h-[11.063rem]">
```

**Recommendation:**
```tsx
<div className="w-24 h-32 sm:w-[8.438rem] sm:h-[11.063rem]">
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
1. Create unified container component with responsive widths
2. Fix Grid system to be responsive (1/2/3 columns)
3. Add mobile padding to all pages

### Phase 2: Navigation (Week 1-2)
4. Implement mobile hamburger menu
5. Fix header social icon touch targets
6. Make footer responsive

### Phase 3: Typography (Week 2)
7. Add responsive text sizing across all pages
8. Fix text justification issues

### Phase 4: Polish (Week 3)
9. Optimize images for mobile
10. Add touch-friendly spacing
11. Test on real devices

---

## Tailwind Breakpoints Reference

```css
/* Mobile First Approach */
sm:  640px   /* @media (min-width: 640px) */
md:  768px   /* @media (min-width: 768px) */
lg:  1024px  /* @media (min-width: 1024px) */
xl:  1280px  /* @media (min-width: 1280px) */
2xl: 1536px  /* @media (min-width: 1536px) */
```

---

## Container Width Standards

**Recommended Unified Approach:**
```tsx
// Component to use everywhere
<div className="container-responsive">
  {/* content */}
</div>

// In globals.css
@layer components {
  .container-responsive {
    @apply w-full px-4 sm:px-6 md:px-8 max-w-[45rem] mx-auto;
  }
}
```

---

## Testing Checklist

### Devices to Test
- [ ] iPhone SE (375px width) - Smallest common mobile
- [ ] iPhone 12/13/14 (390px width)
- [ ] iPhone Pro Max (428px width)
- [ ] iPad Mini (768px width)
- [ ] iPad Pro (1024px width)
- [ ] Desktop (1440px+ width)

### Critical Flows
- [ ] Homepage loads without horizontal scroll
- [ ] All navigation links are tappable
- [ ] Article grids show 1 column on mobile
- [ ] Article grids show 2 columns on tablet
- [ ] Article grids show 3 columns on desktop
- [ ] All text is readable without zooming
- [ ] Footer content doesn't overflow
- [ ] Buttons are large enough to tap (min 44x44px)

---

## Files That Need Updates

### Priority 1 (Critical)
- `src/components/ui/grid/Grid.tsx` - GridRow component
- `src/app/page.tsx` - Homepage container widths
- `src/app/about/page.tsx` - Container widths
- `src/app/directory/page.tsx` - Container widths
- `src/components/Header.tsx` - Mobile navigation

### Priority 2 (High)
- `src/components/Footer.tsx` - Responsive footer
- `src/app/page.tsx` - Hero buttons and typography
- All page files - Typography scaling

### Priority 3 (Medium)
- `src/app/page.tsx` - Featured image
- `src/app/about/page.tsx` - Text justification
- `src/components/Header.tsx` - Icon sizes

---

## Notes

- Current site uses Tailwind CSS v4
- shadcn/ui is installed and available for components
- All measurements currently use rem units (good for accessibility)
- No existing mobile breakpoints - everything is desktop-first
- Consider using shadcn/ui components for mobile menu (Sheet, Drawer)

---

## Next Steps

1. Review and approve this prioritization
2. Create feature branch: `feature/mobile-responsive`
3. Start with Priority 1 fixes
4. Test each fix on multiple screen sizes
5. Create PR after each priority level is complete
