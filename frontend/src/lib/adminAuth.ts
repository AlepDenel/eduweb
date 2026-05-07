import { auth, User } from "@/lib/api";

const REQUEST_TIMEOUT_MS = 8000;

export type AdminAccessResult =
  | { status: "allowed"; user: User }
  | { status: "unauthenticated" }
  | { status: "denied" };

export function withAdminTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS);
    }),
  ]);
}

export async function requireAdminAccess(): Promise<AdminAccessResult> {
  const session = await withAdminTimeout(auth.me(), "Admin request timed out.");

  if (!session.authenticated || !session.user) {
    return { status: "unauthenticated" };
  }

  if (session.user.role !== "Admin") {
    return { status: "denied" };
  }

  return { status: "allowed", user: session.user };
}
