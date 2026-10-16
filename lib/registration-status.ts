import fs from "node:fs";
import path from "node:path";
import { EVENT } from "@/lib/event";
import { HARDCODED_CLOSED_MESSAGE } from "@/lib/registration-constants";

export { HARDCODED_CLOSED_MESSAGE };

const STATUS_FILE = path.join(process.cwd(), "lib", ".registration-status.json");

type StatusStore = {
  isOpen: boolean;
  updatedAt: string | null;
};

function readStatusFile(): StatusStore | null {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const raw = fs.readFileSync(STATUS_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error("Failed to read registration status file:", error);
  }
  return null;
}

function writeStatusFile(data: StatusStore): void {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write registration status file:", error);
  }
}

/**
 * Returns whether event registration is currently open.
 */
export async function isRegistrationOpen(): Promise<boolean> {
  const store = readStatusFile();
  if (store && typeof store.isOpen === "boolean") {
    return store.isOpen;
  }
  if (process.env.REGISTRATION_CLOSED === "true" || process.env.NEXT_PUBLIC_REGISTRATION_CLOSED === "true") {
    return false;
  }
  if ((EVENT as any).registrationClosed === true) {
    return false;
  }
  return true;
}

/**
 * Returns whether event registration is currently closed.
 */
export async function isRegistrationClosed(): Promise<boolean> {
  const open = await isRegistrationOpen();
  return !open;
}

/**
 * Closes the registration.
 */
export async function closeRegistration(): Promise<void> {
  writeStatusFile({
    isOpen: false,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Re-opens the registration.
 */
export async function openRegistration(): Promise<void> {
  writeStatusFile({
    isOpen: true,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Sets registration open/closed state.
 */
export async function setRegistrationStatus(isOpen: boolean): Promise<void> {
  writeStatusFile({
    isOpen,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Returns detailed registration status including the hardcoded polite message.
 */
export async function getRegistrationStatus(): Promise<{
  isOpen: boolean;
  closedMessage: string;
  updatedAt: string | null;
}> {
  const isOpen = await isRegistrationOpen();
  const store = readStatusFile();
  return {
    isOpen,
    closedMessage: HARDCODED_CLOSED_MESSAGE,
    updatedAt: store?.updatedAt ?? null,
  };
}
