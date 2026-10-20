import { getClientPromise } from "@/lib/mongodb";
import corsHeaders from "@/lib/cors";

export async function GET() {
  try {
    const client = await getClientPromise();
    const courses = await client
      .db(process.env.MONGODB_DB)
      .collection("Course")
      .find({})
      .toArray();

    return Response.json(courses, { headers: corsHeaders });
  } catch (error) {
    console.error("Failed to load courses:", error);
    return Response.json(
      { error: "Failed to load courses" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}