import corsHeaders from "@/lib/cors";

export async function POST() {
  const headers = new Headers(corsHeaders);
  headers.set(
    "Set-Cookie",
    `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );

  return Response.json({ message: "Signed out" }, { headers });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
