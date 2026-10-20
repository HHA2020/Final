import jwt from "jsonwebtoken";

export function verifyJWT(req) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return null;
    }

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return null;
    }
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch {
    return null;
  }
}