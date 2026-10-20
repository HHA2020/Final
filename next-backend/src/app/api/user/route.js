import { ObjectId } from "mongodb";
import corsHeaders from "@/lib/cors";
import { verifyJWT } from "@/lib/auth";
import { getClientPromise } from "@/lib/mongodb";

const COLLECTIONS_BY_ROLE = {
  student: "Student",
  teacher: "teacher",
};

export async function GET(request) {
  const claims = verifyJWT(request);
  const collectionName = claims && COLLECTIONS_BY_ROLE[claims.role];

  if (!claims || !collectionName || !ObjectId.isValid(claims.id)) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders },
    );
  }

  const databaseName = process.env.MONGODB_DB;
  if (!databaseName) {
    console.error("MONGODB_DB must be configured");
    return Response.json(
      { error: "Server configuration error" },
      { status: 500, headers: corsHeaders },
    );
  }

  try {
    const client = await getClientPromise();
    const user = await client
      .db(databaseName)
      .collection(collectionName)
      .findOne(
        { _id: new ObjectId(claims.id) },
        { projection: { _id: 0, username: 1, email: 1 } },
      );

    if (!user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders },
      );
    }

    return Response.json(
      { user: { username: user.username, email: user.email, role: claims.role } },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("Failed to load signed-in user:", error);
    return Response.json(
      { error: "Unable to load user profile" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
