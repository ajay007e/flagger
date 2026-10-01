"use client";

import { ApiStatus } from "@/feature/health";
import { Modal } from "@/shared/components/ui";
import { ThemeSwitcher } from "@/shared/theme";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Dismissible, unlike the auth gates — this is an optional dialog, not a
 * mandatory one. Holds whatever the account menu's "Settings" item opens:
 * theme, connectivity, and anything added here later.
 */
export function SettingsModal({ open, onClose }: SettingsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Settings" size="sm">
      <div className="flex flex-col gap-4">
        <section className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Theme</h3>
            <p className="text-sm text-muted">Switch between light and dark.</p>
          </div>
          <ThemeSwitcher />
        </section>

        <section className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">API status</h3>
            <p className="text-sm text-muted">Connectivity to the backend.</p>
          </div>
          <ApiStatus />
        </section>
      </div>
    </Modal>
  );
}
