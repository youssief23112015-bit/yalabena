const fs=require("fs");
const j=JSON.parse(fs.readFileSync("src/locales/en/common.json","utf8"));
console.log("nav.branches =",JSON.stringify(j.nav?.branches));
console.log("inventory =",JSON.stringify(j.inventory,null,1));
