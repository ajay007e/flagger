"use client";

import { KeyRound, UserRound } from "lucide-react";
import { useState } from "react";

import { Badge, Button } from "@/shared/components";
import { Modal } from "@/shared/components/ui/modal/modal";
import { useAuth } from "@/shared/lib/auth";

import { ChangePasswordModal } from "./change-password-modal";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const DETAIL_ROW_CLASS = "flex items-center justify-between gap-4";
const DETAIL_LABEL_CLASS =
  "text-xs font-medium uppercase tracking-wide text-muted";

/**
 * "View profile" from the account menu. Read-only details plus two actions:
 * "Edit profile" (disabled — no edit flow exists yet) and "Change password",
 * which opens the same ChangePasswordModal used for a forced change, but
 * dismissible here since this one is voluntary.
 */
export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Your profile" size="sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <div className={DETAIL_ROW_CLASS}>
              <span className={DETAIL_LABEL_CLASS}>Name</span>
              <span className="truncate text-sm">{user.name}</span>
            </div>

            <div className={DETAIL_ROW_CLASS}>
              <span className={DETAIL_LABEL_CLASS}>Email</span>
              <span className="truncate text-sm">{user.email}</span>
            </div>

            <div className={DETAIL_ROW_CLASS}>
              <span className={DETAIL_LABEL_CLASS}>Role</span>
              <Badge variant="default">{user.type}</Badge>
            </div>
          </div>

          <Button
            variant="outline"
            leftIcon={<UserRound className="h-4 w-4" aria-hidden="true" />}
            disabled
            fullWidth
          >
            Edit profile
          </Button>

          <Button
            variant="outline"
            leftIcon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
            fullWidth
            onClick={() => setChangePasswordOpen(true)}
          >
            Change password
          </Button>
        </div>
      </Modal>

      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        dismissible
      />
    </>
  );
}
