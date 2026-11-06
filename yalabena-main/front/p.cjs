const fs=require("fs");const j=JSON.parse(fs.readFileSync("src/locales/en/common.json","utf8"));
console.log(JSON.stringify(j.public?.placementBook??null,null,1));
