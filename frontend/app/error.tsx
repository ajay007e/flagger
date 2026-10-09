"use client";

import { Button, ErrorState } from "@/shared/components";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState action={<Button onClick={reset}>Try again</Button>} />;
}
