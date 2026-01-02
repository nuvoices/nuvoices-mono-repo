# Manual Testing Plan: NuVoices Web Application

## Using Claude Code Chrome Extension

This plan outlines manual testing procedures for the nuvoices-web application using browser automation via the Claude Code Chrome extension.

---

## Prerequisites

1. Start the development server:
   ```bash
   cd nuvoices-web && pnpm dev
   ```
2. Ensure Chrome extension is connected
3. Application running at `http://localhost:3000`

---

## Test Suites

### 1. Homepage Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| HP-01 | Homepage loads | Navigate to `/` | Page loads with featured post and category sections |
| HP-02 | Featured post displays | Check hero section | Most recent published post shown with image, title, excerpt |
| HP-03 | Magazine section | Scroll to magazine section | Shows 3 latest magazine articles |
| HP-04 | Podcast section | Scroll to podcast section | Shows 3 latest podcast episodes |
| HP-05 | News section | Scroll to news section | Shows 3 latest news articles |
| HP-06 | Article card click | Click any article card | Navigates to correct detail page |

### 2. Navigation Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| NAV-01 | Desktop nav links | Click each nav item (About, Magazine, Podcast, News, Directory) | Each link navigates correctly |
| NAV-02 | Logo visibility - home | Check header on homepage | Logo hidden on homepage |
| NAV-03 | Logo visibility - other | Navigate to `/about` | Logo visible in header |
| NAV-04 | Mobile menu open | Resize to mobile, click hamburger | Full-screen menu overlay appears |
| NAV-05 | Mobile menu close (X) | Click X button | Menu closes |
| NAV-06 | Mobile menu close (outside) | Click outside menu | Menu closes |
| NAV-07 | Mobile nav links | Click each mobile nav item | Navigates correctly and closes menu |
| NAV-08 | Footer links | Click Masthead, Join, Donate, Submit | Each navigates to correct page |

### 3. Content List Pages

#### Magazine (`/magazine`)

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| MAG-01 | Page loads | Navigate to `/magazine` | Grid of magazine articles displayed |
| MAG-02 | Article card info | Inspect article cards | Shows image, title, date, excerpt |
| MAG-03 | Click article | Click any article card | Navigates to `/magazine/[slug]` |
| MAG-04 | Empty state | (If no content) | Shows appropriate message |

#### Podcast (`/podcast`)

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| POD-01 | Page loads | Navigate to `/podcast` | Grid of podcast episodes displayed |
| POD-02 | Episode card info | Inspect episode cards | Shows image, title, date, excerpt |
| POD-03 | Click episode | Click any episode card | Navigates to `/podcast/[slug]` |

#### News (`/news`)

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| NEWS-01 | Page loads | Navigate to `/news` | Grid of news articles displayed |
| NEWS-02 | Article card info | Inspect article cards | Shows image, title, date, excerpt |
| NEWS-03 | Click article | Click any article card | Navigates to `/news/[slug]` |

### 4. Article Detail Pages

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| DET-01 | Hero image | Open any article detail | Featured image displays at top |
| DET-02 | Article metadata | Check header section | Title, author, publish date visible |
| DET-03 | Body content | Scroll through article | Rich text renders correctly |
| DET-04 | Embedded YouTube | Find article with YouTube embed | Video player loads and is playable |
| DET-05 | Embedded Instagram | Find article with IG embed | Instagram post renders |
| DET-06 | Embedded TikTok | Find article with TikTok | TikTok video renders |
| DET-07 | Prev/Next navigation | Click Previous/Next buttons | Navigates to adjacent articles |
| DET-08 | Image captions | Find article with captioned images | Caption displays below image |

### 5. Expert Directory (`/directory`)

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| DIR-01 | Page loads | Navigate to `/directory` | Table loads with expert data |
| DIR-02 | Loading state | Refresh page, observe | Skeleton UI shown during load |
| DIR-03 | Search filter | Type "China" in search | Table filters to matching experts |
| DIR-04 | Search debounce | Type quickly | No excessive API calls (300ms debounce) |
| DIR-05 | Clear search | Delete search text | All results return |
| DIR-06 | Pagination - next | Click next page button | Shows next 20 records |
| DIR-07 | Pagination - prev | Click previous page button | Returns to previous page |
| DIR-08 | Open profile modal | Click any table row | Modal opens with expert details |
| DIR-09 | Modal - info display | Inspect modal content | Shows name, title, location, languages, etc. |
| DIR-10 | Modal - copy email | Click copy email button | Email copied, visual feedback shown |
| DIR-11 | Modal - social links | Click social icon buttons | Opens correct social profile |
| DIR-12 | Modal - close (X) | Click X button | Modal closes |
| DIR-13 | Modal - close (outside) | Click overlay background | Modal closes |
| DIR-14 | Modal - close (Escape) | Press Escape key | Modal closes |
| DIR-15 | Error state | (Simulate API failure) | Error message displays gracefully |

### 6. Static Pages

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| ABOUT-01 | About page | Navigate to `/about` | Mission, story, values display |
| JOIN-01 | Join page | Navigate to `/join` | Chapter and FB group links visible |
| JOIN-02 | Email link | Click nuvoices email | Opens email client |
| DON-01 | Donate page | Navigate to `/donate` | Patreon, FundJournalism, PayPal links |
| DON-02 | External links | Click each donation link | Opens correct external page |
| MAST-01 | Masthead page | Navigate to `/masthead` | Team roster displays |
| SUB-01 | Submissions page | Navigate to `/submissions` | Guidelines display correctly |

### 7. Responsive Design Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| RESP-01 | Mobile viewport | Resize to 375px width | Layout adapts, hamburger menu visible |
| RESP-02 | Tablet viewport | Resize to 768px width | Layout adapts appropriately |
| RESP-03 | Desktop viewport | Resize to 1200px+ width | Full desktop layout |
| RESP-04 | Grid reflow | Check article grids at each size | Columns adjust (1 -> 2 -> 3) |
| RESP-05 | Images scale | Check images at each viewport | Images maintain aspect ratio |
| RESP-06 | Directory mobile | View directory on mobile | Table scrollable, modal usable |

### 8. Performance Tests

| Test ID | Test Case | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| PERF-01 | Initial page load | Navigate to homepage | Page loads within 3 seconds |
| PERF-02 | Image loading | Scroll through content | Images lazy load as needed |
| PERF-03 | API response | Check directory load | Data loads within 2 seconds |
| PERF-04 | Navigation speed | Click between pages | Transitions feel smooth |

---

## Automation Scripts (Chrome Extension)

### Quick Smoke Test Flow

```
1. Navigate to localhost:3000
2. Take screenshot of homepage
3. Click "Magazine" in navigation
4. Verify magazine grid loads
5. Click first article
6. Verify article detail page loads
7. Navigate to /directory
8. Search for "journalist"
9. Click first result
10. Verify modal opens
11. Close modal
12. Take final screenshot
```

### Directory Full Test Flow

```
1. Navigate to localhost:3000/directory
2. Wait for table to load
3. Screenshot initial state
4. Enter search term "economics"
5. Wait 500ms for debounce
6. Screenshot filtered results
7. Click next page
8. Screenshot page 2
9. Click any row
10. Screenshot modal
11. Click copy email
12. Verify feedback text
13. Press Escape
14. Verify modal closed
```

---

## Browser Compatibility Matrix

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | Primary (automation target) |
| Firefox | Latest | Manual verification |
| Safari | Latest | Manual verification |
| Edge | Latest | Manual verification |

---

## Test Execution Notes

### Using Claude Code Chrome Extension

1. **Tab Management**: Use `tabs_context_mcp` to get current tabs, `tabs_create_mcp` for new tabs
2. **Navigation**: Use `navigate` tool with `url` parameter
3. **Finding Elements**: Use `find` or `read_page` tools
4. **Clicking**: Use `computer` tool with `left_click` action
5. **Screenshots**: Use `computer` tool with `screenshot` action
6. **Form Input**: Use `form_input` tool for search fields
7. **GIF Recording**: Use `gif_creator` for multi-step flows

### Example Commands

- Navigate: `navigate` with url `http://localhost:3000`
- Take screenshot: `computer` with action `screenshot`
- Click element: `computer` with action `left_click` and coordinate/ref
- Type in search: `form_input` with ref and value
- Read page structure: `read_page` with tabId

---

## Defect Severity Levels

| Level | Description |
|-------|-------------|
| Critical | Application crashes, data loss, security issues |
| High | Major feature broken, no workaround |
| Medium | Feature partially working, workaround exists |
| Low | Minor UI issues, cosmetic problems |

---

## Sign-off Checklist

- [ ] All critical paths tested
- [ ] Navigation works on desktop and mobile
- [ ] Content loads from Sanity CMS
- [ ] Directory search and filtering works
- [ ] External links open correctly
- [ ] Responsive design verified
- [ ] No console errors in production build
