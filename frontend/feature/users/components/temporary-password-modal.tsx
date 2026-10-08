"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button, FormError, Modal, toast } from "@/shared/components";

import type { UserCredentials } from "../users.types";

interface TemporaryPasswordModalProps {
  credentials: UserCredentials | null;
  onClose: () => void;
}

export function TemporaryPasswordModal({
  credentials,
  onClose,
}: TemporaryPasswordModalProps) {
  return (
    <Modal
      open={credentials !== null}
      onClose={onClose}
      dismissible={false}
      title="Temporary password"
      description={
        credentials ? `${credentials.name} (${credentials.email})` : undefined
      }
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {credentials ? (
        <PasswordPanel
          key={credentials.temporaryPassword}
          password={credentials.temporaryPassword}
        />
      ) : null}
    </Modal>
  );
}

function PasswordPanel({ password }: { password: string }) {
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      toast.error("Couldn't copy. Select the password and copy it manually.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FormError>
        This password is shown only once and cannot be retrieved later. Copy it
        now and share it securely. The user must change it at first login. If it
        is lost, reset the password again.
      </FormError>

      <code className="block select-all break-all rounded-lg border border-border bg-muted/10 p-3 font-mono text-sm">
        {password}
      </code>

      <Button
        variant="outline"
        fullWidth
        leftIcon={
          copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />
        }
        onClick={() => void copy()}
      >
        {copied ? "Copied" : "Copy password"}
      </Button>
    </div>
  );
}
