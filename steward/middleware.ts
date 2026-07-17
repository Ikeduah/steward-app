import { clerkMiddleware } from "@clerk/nextjs/server";

// getAuth() in pages/api routes throws unless clerkMiddleware has run on the
// request. Only these two routes use it. Listed individually rather than as
// /api/assets/:path* because the rest of /api/assets/* rewrites to the FastAPI
// function (api/index.py), which does its own JWKS verification and must not
// be subjected to Clerk's handshake redirects.
export default clerkMiddleware();

export const config = {
  matcher: ["/api/assets/upload-url", "/api/assets/delete-blob"],
};
