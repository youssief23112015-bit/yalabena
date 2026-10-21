const fs=require("fs"),path=require("path");
const files=[];
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(e.name))files.push(p);}})("src");
const src=files.map(f=>fs.readFileSync(f,"utf8")).join("\n");
const inv=JSON.parse(fs.readFileSync("src/locales/en/inventory.json","utf8"));
for(const k of Object.keys(inv)){
  const re=new RegExp(`t\\(\\s*["'\`]${k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}["'\`]`);
  const m=src.match(new RegExp(re.source,"g"));
  console.log(`${m?"USED  ":"UNUSED"} ${k}`);
}
