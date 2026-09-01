import { execFileSync } from "child_process";

let cached: boolean | null = null;

/**
 * Detect whether the current Nexo process is running elevated (Run as
 * administrator). Uses the standard WindowsPrincipal role check. The result is
 * cached because it cannot change during a process lifetime.
 */
export function isElevated(): boolean {
  if (cached !== null) return cached;
  try {
    const out = execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "[bool](([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))",
      ],
      { windowsHide: true, timeout: 10000 },
    )
      .toString()
      .trim();
    cached = out === "True";
  } catch {
    cached = false;
  }
  return cached;
}

export const ADMIN_REQUIRED_MESSAGE =
  "Administrator privileges are required for this operation.";
