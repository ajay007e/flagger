import { forwardRef } from "react";

import { cn } from "@/shared/lib/utils";

import { avatarVariants } from "./avatar.styles";
import type { AvatarProps } from "./avatar.types";

function getInitial(name: string): string {
  const trimmed = name.trim();

  return trimmed.length > 0 ? trimmed[0]!.toUpperCase() : "?";
}

/**
 * Always the same primary-token color, deliberately — the theme's semantic
 * tokens (success/danger/warning) each carry meaning, so reusing them just
 * for visual variety between different people's avatars would be confusing.
 * If a list of many users later needs to tell avatars apart at a glance,
 * that calls for its own decorative palette, not a repurposing of this one.
 *
 * Decorative by default (aria-hidden): when used as an interactive trigger
 * (e.g. a navbar menu button), the wrapping element should carry its own
 * aria-label rather than relying on this component's content.
 */
const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ name, size, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        {getInitial(name)}
      </span>
    );
  },
);

Avatar.displayName = "Avatar";

export default Avatar;
