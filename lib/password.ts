import "server-only";
import { randomInt } from "crypto";

// Excludes visually ambiguous characters (0/O, 1/I/l) since faculty read
// these off a spreadsheet and hand them to students verbally/on paper.
const PASSWORD_CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";

export function generatePassword(length = 5): string {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARSET[randomInt(PASSWORD_CHARSET.length)];
  }
  return password;
}
