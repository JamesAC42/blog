// check-hash.mjs
import 'dotenv/config';
import bcrypt from 'bcrypt';

const plain = 'admin';
const hash = process.env.ADMIN_PASSWORD_HASH;

console.log('hash prefix:', hash?.slice(0, 7));
console.log('match:', await bcrypt.compare(plain, hash));