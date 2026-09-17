import { IconChartBar } from '@tabler/icons-react';
import { useState } from 'react';

import { AuraReviewPage } from './AuraReviewPage';

// Self-contained: renders a fixed floating button plus (when open) a full-screen
// overlay of AuraReviewPage. Deliberately doesn't touch the host app's own nav/routing —
// render this once near the app's root (see README.md) and it works regardless of what
// that app's own structure looks like, since every reviewed app is generated fresh and
// its structure can't be predicted ahead of time.
export function AuraReviewLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Aura Review"
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <IconChartBar aria-hidden className="size-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
          <AuraReviewPage onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
