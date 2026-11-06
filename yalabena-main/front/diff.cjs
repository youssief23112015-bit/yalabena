const fs=require("fs");
const flat=(o,p="")=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==="object"?flat(v,p+k+"."):[p+k]);
const a=flat(JSON.parse(fs.readFileSync("src/locales/ar/common.json","utf8")));
const b=flat(JSON.parse(fs.readFileSync("src/locales/ar/auth_temp.json","utf8")));
console.log("common.json keys:",a.length,"auth_temp.json keys:",b.length);
console.log("only in auth_temp:",b.filter(k=>!a.includes(k)).length);
console.log("only in common:",a.filter(k=>!b.includes(k)).length);
