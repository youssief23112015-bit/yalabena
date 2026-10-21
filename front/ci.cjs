const fs=require("fs"),path=require("path");
const files=[];
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(e.name))files.push(p);}})("src");
const src=files.map(f=>fs.readFileSync(f,"utf8")).join("\n");
const j=JSON.parse(fs.readFileSync("src/locales/en/common.json","utf8"));
console.log("=== common.inventory.* usage ===");
for(const k of Object.keys(j.inventory)){
  const esc=k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const used=new RegExp(`["'\`]inventory\\.${esc}["'\`]`).test(src)||new RegExp(`t\\(\\s*["'\`]${esc}["'\`]`).test(src);
  console.log(`${used?"USED  ":"UNUSED"} inventory.${k}`);
}
console.log("\n=== conversion rate keys ===");
for(const [ns,obj] of Object.entries(j)) if(obj&&typeof obj==="object") for(const k of Object.keys(obj)) if(/conver/i.test(k)) console.log(ns+"."+k);
