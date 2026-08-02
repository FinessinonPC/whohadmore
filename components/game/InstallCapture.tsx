"use client";

// Renders nothing. Exists so lib/installPrompt evaluates - and starts
// listening for beforeinstallprompt - as early as the client bundle loads.
// See the comment in that file for why an effect would be too late.
import "@/lib/installPrompt";

export function InstallCapture() {
  return null;
}
