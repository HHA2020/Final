import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";

const COLLECTIONS_BY_ROLE = {
  student: "Student",
  teacher: "teacher",
};
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 8;

function jsonResponse(body, status) {
  return Response.json(body, { status, headers: corsHeaders });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON" }, 400);
  }

  const role = typeof body.role === "string" ? body.role.toLowerCase() : "";
  const collectionName = COLLECTIONS_BY_ROLE[role];
  const identifier =
    typeof body.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!collectionName || !identifier || !password) {
    return jsonResponse(
      { error: "Role, username/email, and password are required" },
      400,
    );
  }

  const databaseName = process.env.MONGODB_DB;
  const jwtSecret = process.env.JWT_SECRET;
  if (!databaseName || !jwtSecret) {
    console.error("MONGODB_DB and JWT_SECRET must be configured");
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  try {
    const client = await getClientPromise();
    const collection = client.db(databaseName).collection(collectionName);
    const user = await collection.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!user || typeof user.password !== "string") {
      return jsonResponse({ error: "Invalid role, username/email, or password" }, 401);
    }

    const hasBcryptHash = /^\$2[aby]\$\d{2}\$/.test(user.password);
    const passwordIsValid = hasBcryptHash
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (!passwordIsValid) {
      return jsonResponse({ error: "Invalid role, username/email, or password" }, 401);
    }

    if (!hasBcryptHash) {
      const passwordHash = await bcrypt.hash(password, 12);
      const update = await collection.updateOne(
        { _id: user._id, password: user.password },
        { $set: { password: passwordHash } },
      );

      if (update.matchedCount !== 1) {
        throw new Error("Could not securely migrate the user's password");
      }
    }

    const safeUser = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role,
    };
    const token = jwt.sign(safeUser, jwtSecret, {
      expiresIn: TOKEN_MAX_AGE_SECONDS,
    });

    const headers = new Headers(corsHeaders);
    headers.set(
      "Set-Cookie",
      `token=${token}; HttpOnly; Path=/; Max-Age=${TOKEN_MAX_AGE_SECONDS}; SameSite=Lax${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`,
    );

    return Response.json(
      { user: { username: safeUser.username, email: safeUser.email, role } },
      { headers },
    );
  } catch (error) {
    console.error("Login failed:", error);
    return jsonResponse({ error: "Unable to sign in" }, 500);
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
