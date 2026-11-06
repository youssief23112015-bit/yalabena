const fs=require("fs");
const j=JSON.parse(fs.readFileSync("src/locales/en/common.json","utf8"));
console.log("TOP KEYS:",Object.keys(j).join(", "));
console.log("\n--- common ---");console.log(JSON.stringify(j.common,null,1));
console.log("\n--- public keys ---");console.log(Object.keys(j.public??{}).join(", "));
console.log("\n--- public.placementBook ---");console.log(JSON.stringify(j.public?.placementBook??null,null,1));
