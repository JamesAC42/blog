import bcrypt from "bcrypt";

const pwd = process.argv[2];
if (!pwd) {
  console.error("Usage: node make-hash.mjs <password>");
  process.exit(1);
}

const rounds = Number(process.env.BCRYPT_ROUNDS || 12);
const salt = await bcrypt.genSalt(rounds);
const hash = await bcrypt.hash(pwd, salt);
console.log(hash);