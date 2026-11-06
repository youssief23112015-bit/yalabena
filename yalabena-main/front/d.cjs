const fs=require("fs");const j=JSON.parse(fs.readFileSync("src/locales/en/common.json","utf8"));
console.log(Object.keys(j).join(", "));
console.log("--- dash ---", JSON.stringify(j.dashboards??j.dashboard??null,null,1).slice(0,1500));
