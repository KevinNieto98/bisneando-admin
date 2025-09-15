const fs = require("fs");
const path = require("path");

const cookiePath = path.join(process.cwd(), ".next", "cookies"); 
if (fs.existsSync(cookiePath)) {
  fs.rmSync(cookiePath, { recursive: true, force: true });
  console.log("Cookies borradas ✅");
}