"use client";

import { type ButtonHTMLAttributes, type MouseEvent } from "react";
import { COOKIE_CONSENT_OPEN_EVENT } from "@/lib/cookie-consent";

type OpenCookieSettingsButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function OpenCookieSettingsButton({
  onClick,
  type = "button",
  ...props
}: OpenCookieSettingsButtonProps) {
  const onButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT));
  };

  return <button type={type} onClick={onButtonClick} {...props} />;
}
