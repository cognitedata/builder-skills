# Handling states, validation, and accessibility

## Role

You are implementing how the application responds to user actions and ensuring page-level accessibility. These patterns determine whether users trust the application. Follow them for every form, API call, and user action.

Aura components handle many accessibility concerns automatically; you are responsible for composition, copy, focus, and page structure. Aura's focus system uses `shadow-focus-ring` (custom shadow token). Never remove or override it.

All UI elements use Aura components and tokens. Error states use the destructive token family, warnings use warning tokens, success uses success tokens.

For message wording patterns, see Content guidelines in `./node_modules/@cognite/aura/DESIGN.md`.

For all Storybook URLs, see `./storybook-links.md`.

<aura-coverage priority="high">
What Aura components handle automatically:

| Concern | Aura handles | You verify |
|---------|-------------|-----------|
| Focus indicators | shadow-focus-ring on interactive elements | Not hidden by overflow or z-index |
| Keyboard activation | Button: Enter/Space. Input: standard keys | Custom elements also respond |
| ARIA roles | Correct roles on Dialog, Segmented Control (Tabs ARIA pattern), etc. | Custom components have roles |
| Color contrast | Token pairs designed for AA compliance | Page backgrounds don't reduce contrast |
| Dark mode | Semantic tokens adapt automatically | Custom colors also work in dark mode |
| Disabled states | Communicated via aria-disabled | Reason for disabled is accessible |
| Focus trapping | Dialog traps focus when open | You return focus to trigger on close |
</aura-coverage>

<patterns>

<pattern name="form-validation" priority="critical">
<instruction>
- Validate on blur, not on every keystroke
- Show errors inline, adjacent to the field
- Preserve user input on failure (never clear the form)
- Move focus to first error field on submission failure
- Announce errors to screen readers via aria-live
</instruction>

<status-token-mapping>
| State | Background | Text | Border |
|-------|-----------|------|--------|
| Error | bg-destructive | text-destructive-foreground | border-destructive |
| Warning | bg-warning | text-warning-foreground | — |
| Success | bg-success | text-success-foreground | — |
| Disabled | bg-disabled | text-disabled-foreground | — |
</status-token-mapping>

<message-patterns>
| Field type | Correct message | Incorrect message |
|-----------|----------------|-------------------|
| Required | "Report name is required." | "Required" |
| Email | "Email must include an @ symbol." | "Invalid" |
| Password | "At least 8 characters." | "Too short" |
| Number | "Value must be between 1 and 100." | "Invalid" |
| Date | "End date must be after start date." | "Invalid date" |

See Content guidelines in `./node_modules/@cognite/aura/DESIGN.md` for full message patterns.
</message-patterns>

<field-validation-states>
Every form field must support the validation states applicable to its type. Use this table to determine which states to implement:

| Field type | required | format | length | range | uniqueness |
|-----------|----------|--------|--------|-------|------------|
| Text Input | yes | — | optional | — | optional |
| Email Input | yes | yes | — | — | optional |
| Password | yes | yes | yes | — | — |
| Number Input | yes | — | — | yes | — |
| Date Picker | yes | — | — | yes | — |
| Textarea | yes | — | yes | — | — |
| Select | yes | — | — | — | — |
| Combobox | yes | — | — | — | — |
| Checkbox | — | — | — | — | — |
| File Upload | yes | yes | — | yes (size) | — |

"yes" = must implement. "optional" = implement if relevant.
</field-validation-states>

<complete-field-example>
A complete form field with all states (default, focused, error, success, disabled):

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HelperText } from '@/components/ui/helper-text';

{/* Default / Focused state */}
<div className="space-y-2">
  <Label htmlFor="report-name">
    Report name <span className="text-destructive">*</span>
  </Label>
  <Input
    id="report-name"
    value={name}
    onChange={(e) => setName(e.target.value)}
    onBlur={validateName}
    aria-describedby="report-name-helper"
    aria-invalid={!!nameError}
    disabled={isSubmitting}
  />
  {nameError ? (
    <HelperText id="report-name-helper" variant="error">
      {nameError}
    </HelperText>
  ) : (
    <HelperText id="report-name-helper">
      A descriptive name for your report.
    </HelperText>
  )}
</div>

Key implementation details:
- Label with required indicator (asterisk in text-destructive)
- Input with aria-describedby linking to HelperText
- Input with aria-invalid reflecting error state
- Validation on blur via onBlur handler
- HelperText swaps between hint (default) and error message
- Disabled state during form submission
</complete-field-example>
</pattern>

<pattern name="loading-states" priority="critical">
<instruction>
Any action taking more than 300ms must show a loading indicator using Aura components.
</instruction>

<variants>
| Context | Pattern | Aura component |
|---------|---------|---------------|
| Page load | Skeleton screen | Skeleton |
| Button action | Button disabled + spinner | Button loading state |
| Data refresh | Overlay spinner | Spinner on existing content |
| Long operation | Progress bar + message | Progress |
</variants>

<example type="correct">
{/* Button loading during async action */}
<Button
  variant="default"
  onClick={handleSave}
  disabled={isSaving}
>
  {isSaving ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    'Save changes'
  )}
</Button>

{/* Skeleton while page loads */}
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
) : (
  <DataTable data={reports} columns={columns} />
)}
</example>

<example type="incorrect">
{/* No loading state */}
<Button onClick={handleSave}>Save changes</Button>

{/* Blank screen while loading */}
{isLoading ? null : <DataTable data={reports} />}
</example>
</pattern>

<pattern name="error-states" priority="critical">
<instruction>
Every API failure must show a user-facing message using Aura Alert component. Never fail silently.
See Content guidelines in `./node_modules/@cognite/aura/DESIGN.md` for message wording.
</instruction>

<full-example>
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      {error}
    </AlertDescription>
    <Button
      variant="secondary"
      size="sm"
      onClick={retry}
      className="ml-auto"
    >
      Try again
    </Button>
  </Alert>
)}
</full-example>
</pattern>

<pattern name="success-feedback" priority="high">
<instruction>
Use Sonner toast for brief confirmations.
</instruction>

<example type="correct">
import { toast } from 'sonner';

// After save
toast.success('Report saved successfully.');

// After delete
toast.success('Report deleted.');

// After bulk action
toast.success(`${count} items archived.`);
</example>

<example type="incorrect">
// No feedback
await saveReport(data);
navigate('/reports');

// Vague
toast.success('Done!');
</example>
</pattern>

<pattern name="confirmation-dialogs" priority="critical">
<instruction>
Destructive actions must show Dialog with specific action verb. See Content guidelines in `./node_modules/@cognite/aura/DESIGN.md` for copy.
</instruction>

<full-example>
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

<Dialog open={showDelete} onOpenChange={setShowDelete}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete this report?</DialogTitle>
      <DialogDescription>
        This will permanently remove "{report.name}" and
        all associated data. This cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button
        variant="secondary"
        onClick={() => setShowDelete(false)}
      >
        Cancel
      </Button>
      <Button
        variant="destructive"
        onClick={handleDelete}
      >
        Delete report
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
</full-example>

<example type="incorrect">
{/* Yes/No, no description, wrong variant */}
<Dialog open={show}>
  <DialogContent>
    <DialogTitle>Confirm</DialogTitle>
    <DialogDescription>Are you sure?</DialogDescription>
    <DialogFooter>
      <Button variant="secondary">No</Button>
      <Button variant="default">Yes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
</example>
</pattern>

</patterns>

<page-accessibility priority="critical">

<responsibility name="keyboard-navigation">
<instruction>
- Tab order follows visual reading order
- Every interactive element reachable via Tab
- No keyboard traps
- Skip-to-content link on pages with complex nav
</instruction>

<example type="correct">
<a href="#main-content" className="sr-only focus:not-sr-only
  focus:absolute focus:top-4 focus:left-4 focus:z-50
  focus:bg-background focus:px-4 focus:py-2 focus:rounded-md
  focus:shadow-focus-ring">
  Skip to main content
</a>
<Sidebar />
<main id="main-content">
  <h1>Reports</h1>
  {/* Content in logical tab order */}
</main>
</example>
</responsibility>

<responsibility name="heading-hierarchy">
<instruction>
Use heading levels (H1–H6) in strict sequential order.
- One H1 per page (the page title)
- Never skip levels (H1 directly to H3)
- Never use heading tags for visual sizing — use text-*
  classes from the Typography foundation instead

Aura applies text-undefined-foreground to headings by default.
</instruction>
</responsibility>

<responsibility name="image-alt-text">
<instruction>
Every image needs alt. Icons in buttons need aria-label.
</instruction>

<examples>
| Type | Approach | Example |
|------|----------|---------|
| Informational | Describe content | alt="Chart: output up 20%" |
| Decorative | Empty | alt="" |
| Icon button | aria-label on parent | aria-label="Delete report" |
| Icon with label | Hide icon | aria-hidden="true" on icon |
</examples>

<example type="correct">
{/* Icon + text: hide icon from screen reader */}
<Button variant="destructive">
  <TrashIcon className="h-4 w-4 mr-2" aria-hidden="true" />
  Delete report
</Button>

{/* Icon only: label on button */}
<Button variant="ghost" size="icon" aria-label="Delete report">
  <TrashIcon className="h-4 w-4" />
</Button>
</example>
</responsibility>

<responsibility name="dynamic-content">
<examples>
| Scenario | Method |
|----------|--------|
| Search results update | aria-live="polite" |
| Form error | aria-live="assertive" |
| Toast | Sonner handles this |
| Dialog opens | Focus moves to dialog (Aura handles) |
| Dialog closes | Return focus to trigger |
</examples>

<example type="correct">
{/* Screen reader announcement for filtered results */}
<div aria-live="polite" className="sr-only">
  {results.length} results found for "{query}"
</div>
<DataTable data={results} columns={columns} />
</example>
</responsibility>

<responsibility name="color-independence">
<instruction>
Never use color alone to convey meaning.
</instruction>

<example type="correct">
{/* Status with text + color */}
<span className="inline-flex items-center gap-1.5
  bg-success text-success-foreground text-xs px-2.5 py-0.5
  rounded-full">
  <CheckCircle className="h-3 w-3" aria-hidden="true" />
  Active
</span>
</example>

<example type="incorrect">
{/* Color only — invisible to colorblind users */}
<span className="h-2 w-2 rounded-full bg-success" />
</example>
</responsibility>

</page-accessibility>

<translation-and-testing priority="medium">
Short sentences and simple grammar translate more reliably. Plan for text expansion in localized UIs (e.g. German often adds 30–40% length); allow flexible button and title widths.

For automated checks, use WAVE, axe DevTools, or Lighthouse in Chrome DevTools. For manual verification, unplug the mouse and complete primary tasks with keyboard only; spot-check with VoiceOver (Mac) or NVDA (Windows) for critical flows.
</translation-and-testing>

<self-check>
Before submitting any page:
- [ ] Tab through all elements in logical order?
- [ ] Every button/link works with Enter/Space?
- [ ] Every dialog opens/closes with keyboard?
- [ ] Escape closes dialogs, popovers, dropdowns?
- [ ] Every image has appropriate alt text?
- [ ] Every form field has a visible label?
- [ ] Non-color indicator for every status?
- [ ] Headings follow H1 → H2 → H3?
- [ ] Dynamic updates announced to screen readers?
- [ ] Focus ring (shadow-focus-ring) visible on all elements?
</self-check>

<edge-cases>
**Forms and async**
1. Destructive action with undo? — Still confirm. Mention undo in body: "You can undo within 30 seconds."
2. Bulk delete? — One confirmation: "Delete 12 reports?"
3. Auto-save? — Subtle "Saved" indicator, not toast each time.
4. Error in multi-step flow? — Don't lose progress. Show error on current step. Let user retry.

**Accessibility**
1. Complex data viz? — Text summary via alt or sr-only text.
2. Drag-and-drop? — Keyboard alternative required.
3. Real-time dashboard? — aria-live="polite", not "assertive".
4. Third-party embed? — iframe with descriptive title.
</edge-cases>
