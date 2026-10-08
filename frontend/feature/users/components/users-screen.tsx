"use client";

import {
  KeyRound,
  Pencil,
  RotateCcw,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  Badge,
  Button,
  ConfirmDialog,
  Field,
  Pager,
  ResourceList,
  ResourceRow,
} from "@/shared/components";
import { useAction, useDebouncedValue } from "@/shared/hooks";

import {
  USER_SEARCH_MAX_LENGTH,
  USER_STATUS_LABELS,
  USER_STATUSES,
  USER_TYPE_LABELS,
  USER_TYPES,
  USERS_PAGE_SIZE,
  USERS_SEARCH_DEBOUNCE_MS,
} from "../users.constants";
import { useUsers } from "../users.hook";
import { usersService } from "../users.service";
import type {
  User,
  UserCredentials,
  UserStatus,
  UserType,
} from "../users.types";
import { TemporaryPasswordModal } from "./temporary-password-modal";
import { UserFormModal } from "./user-form-modal";

type PendingKind = "disable" | "enable" | "reset" | "delete" | "restore";

const CONFIRMS: Record<
  PendingKind,
  {
    title: string;
    description: (name: string) => string;
    confirmLabel: string;
    success: string;
    destructive: boolean;
  }
> = {
  disable: {
    title: "Disable user?",
    description: (name) =>
      `${name} will be signed out and can't log in until you enable them again.`,
    confirmLabel: "Disable",
    success: "User disabled",
    destructive: true,
  },
  enable: {
    title: "Enable user?",
    description: (name) => `${name} will be able to log in again.`,
    confirmLabel: "Enable",
    success: "User enabled",
    destructive: false,
  },
  reset: {
    title: "Reset password?",
    description: (name) =>
      `${name} will be signed out everywhere and must set a new password. A temporary password is shown once.`,
    confirmLabel: "Reset password",
    success: "Password reset",
    destructive: true,
  },
  delete: {
    title: "Delete user?",
    description: (name) =>
      `${name} will be signed out and can't log in until you restore them. Their email stays reserved.`,
    confirmLabel: "Delete",
    success: "User deleted",
    destructive: true,
  },
  restore: {
    title: "Restore user?",
    description: (name) => `${name} will be available again.`,
    confirmLabel: "Restore",
    success: "User restored",
    destructive: false,
  },
};

const CALLS: Record<
  Exclude<PendingKind, "reset">,
  (id: number) => Promise<unknown>
> = {
  disable: usersService.disable,
  enable: usersService.enable,
  delete: usersService.remove,
  restore: usersService.restore,
};

export function UsersScreen() {
  const [searchInput, setSearchInput] = useState("");
  const [type, setType] = useState<UserType | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(
    searchInput.trim(),
    USERS_SEARCH_DEBOUNCE_MS,
  );

  const { data, loading, error, refetch } = useUsers({
    page,
    limit: USERS_PAGE_SIZE,
    search,
    type: type || undefined,
    status: status || undefined,
  });
  const { busy, run } = useAction(refetch);

  const [form, setForm] = useState<{ user: User | null } | null>(null);
  const [pending, setPending] = useState<{
    kind: PendingKind;
    user: User;
  } | null>(null);
  const [credentials, setCredentials] = useState<UserCredentials | null>(null);

  const users = data?.items ?? [];
  const meta = data?.meta;
  const filtered = Boolean(search || type || status);
  const confirm = pending ? CONFIRMS[pending.kind] : null;

  useEffect(() => {
    if (data && data.items.length === 0 && page > 1) {
      setPage(Math.max(1, data.meta.totalPages));
    }
  }, [data, page]);

  async function confirmAction(): Promise<void> {
    if (!pending) return;

    const { kind, user } = pending;

    if (kind === "reset") {
      await run(async () => {
        const { data: body } = await usersService.resetPassword(user.id);

        if (!body.success) {
          throw new Error(body.message);
        }

        setCredentials(body.data);
      }, CONFIRMS.reset.success);
    } else {
      await run(() => CALLS[kind](user.id), CONFIRMS[kind].success);
    }

    setPending(null);
  }

  const TYPE_FILTER_OPTIONS = [
    { value: "", label: "All types" },
    ...USER_TYPES.map((value) => ({ value, label: USER_TYPE_LABELS[value] })),
  ];

  const STATUS_FILTER_OPTIONS = [
    { value: "", label: "Active and disabled" },
    ...USER_STATUSES.map((value) => ({
      value,
      label: USER_STATUS_LABELS[value],
    })),
  ];

  return (
    <>
      <ResourceList
        title="Users"
        description="Create accounts and manage who can sign in."
        createLabel="New user"
        onCreate={() => setForm({ user: null })}
        loading={loading && !data}
        error={error}
        onRetry={refetch}
        isEmpty={users.length === 0}
        emptyText={filtered ? "No users match your filters." : "No users yet."}
        search={
          <Field>
            <Field.Input
              type="search"
              aria-label="Search users"
              placeholder="Search by name or email"
              maxLength={USER_SEARCH_MAX_LENGTH}
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setPage(1);
              }}
            />
          </Field>
        }
        filters={
          <>
            <Field.Select
              aria-label="Filter by type"
              width="md"
              className="min-w-0 flex-1 sm:flex-none"
              options={TYPE_FILTER_OPTIONS}
              value={type}
              onValueChange={(value) => {
                setType(value as UserType | "");
                setPage(1);
              }}
            />

            <Field.Select
              aria-label="Filter by status"
              width="md"
              className="min-w-0 flex-1 sm:flex-none"
              options={STATUS_FILTER_OPTIONS}
              value={status}
              onValueChange={(value) => {
                setStatus(value as UserStatus | "");
                setPage(1);
              }}
            />
          </>
        }
      >
        {users.map((user) => {
          const deleted = Boolean(user.deletedAt);

          return (
            <ResourceRow
              key={user.id}
              name={
                <>
                  {user.name}
                  {!user.isActive && !deleted ? (
                    <Badge variant="outline" className="ml-2">
                      Disabled
                    </Badge>
                  ) : null}
                </>
              }
              itemKey={USER_TYPE_LABELS[user.type]}
              description={user.email}
              deleted={deleted}
              actions={
                deleted ? (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                    disabled={busy}
                    onClick={() => setPending({ kind: "restore", user })}
                  >
                    Restore
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Pencil className="h-4 w-4" />}
                      onClick={() => setForm({ user })}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={
                        user.isActive ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )
                      }
                      onClick={() =>
                        setPending({
                          kind: user.isActive ? "disable" : "enable",
                          user,
                        })
                      }
                    >
                      {user.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<KeyRound className="h-4 w-4" />}
                      onClick={() => setPending({ kind: "reset", user })}
                    >
                      Reset password
                    </Button>
                    <Button
                      variant="danger-outline"
                      size="sm"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => setPending({ kind: "delete", user })}
                    >
                      Delete
                    </Button>
                  </>
                )
              }
            />
          );
        })}
      </ResourceList>

      {meta ? (
        <Pager
          className="mt-6"
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          disabled={loading}
          onPageChange={setPage}
        />
      ) : null}

      <UserFormModal
        open={form !== null}
        user={form?.user ?? null}
        onClose={() => setForm(null)}
        onSaved={(created) => {
          setForm(null);

          if (created) {
            setCredentials(created);
          }

          void refetch();
        }}
      />

      <ConfirmDialog
        open={pending !== null}
        title={confirm?.title ?? ""}
        description={
          pending && confirm ? confirm.description(pending.user.name) : ""
        }
        confirmLabel={confirm?.confirmLabel}
        confirmVariant={confirm?.destructive === false ? "outline" : "danger"}
        loading={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => void confirmAction()}
      />

      <TemporaryPasswordModal
        credentials={credentials}
        onClose={() => setCredentials(null)}
      />
    </>
  );
}
