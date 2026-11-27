/**
 * Org scoping for asset photos stored in Vercel Blob.
 *
 * Every photo is uploaded under `orgs/<orgId>/`. The upload and delete routes
 * use these helpers so an org can only write to, and delete from, its own
 * folder. Without this, any signed-in user could delete another org's photos
 * by sending its URL to /api/assets/delete-blob.
 *
 * Kept free of Next.js and Clerk imports so it can run on the client too.
 */

const BLOB_HOST_SUFFIX = ".blob.vercel-storage.com";

/** Folder every photo for this org must live under, e.g. `orgs/org_123/`. */
export function orgBlobPrefix(orgId: string): string {
  return `orgs/${orgId}/`;
}

/** Clerk reports the admin role as "org:admin" (SDK) or "admin" (raw claim). */
export function isOrgAdmin(orgRole: string | null | undefined): boolean {
  return orgRole === "org:admin" || orgRole === "admin";
}

/** Strip anything that could escape the org folder or break the path. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() || "image";
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, "_").replace(/^\.+/, "");
  return cleaned.slice(0, 100) || "image";
}

/** Path the browser should upload a new photo to. */
export function orgBlobPathname(orgId: string, fileName: string): string {
  return `${orgBlobPrefix(orgId)}${safeFileName(fileName)}`;
}

/** True if an upload pathname sits directly inside this org's folder. */
export function isOrgUploadPath(pathname: string, orgId: string): boolean {
  const prefix = orgBlobPrefix(orgId);
  if (!pathname.startsWith(prefix)) return false;
  const rest = pathname.slice(prefix.length);
  // One plain file name only: no sub-folders, no "..", not empty.
  return rest.length > 0 && !rest.includes("/") && !rest.includes("\\") && !rest.includes("..");
}

/** True if a Blob URL points at a photo inside this org's folder. */
export function isOrgBlobUrl(url: string, orgId: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(BLOB_HOST_SUFFIX)) {
    return false;
  }
  let pathname: string;
  try {
    pathname = decodeURIComponent(parsed.pathname).replace(/^\//, "");
  } catch {
    return false;
  }
  return isOrgUploadPath(pathname, orgId);
}
