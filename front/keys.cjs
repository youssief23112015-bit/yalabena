const fs=require("fs"),path=require("path");
const files=[];
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(e.name))files.push(p);}})("src");
const src=files.map(f=>fs.readFileSync(f,"utf8")).join("\n");
const flat=(o,p="")=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==="object"?flat(v,p+k+"."):[[p+k,v]]);
for(const ns of ["en","ar"]){
  const inv=flat(JSON.parse(fs.readFileSync(`src/locales/${ns}/inventory.json`,"utf8")));
  const common=flat(JSON.parse(fs.readFileSync(`src/locales/${ns}/common.json`,"utf8")));
  const check=(list,label)=>{
    console.log(`\n=== ${ns}/${label} ===`);
    for(const [k,v] of list){
      const leaf=k.split(".").pop();
      const used=new RegExp(`["'\`]([^"'\`]*\\b${leaf.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b[^"'\`]*)["'\`]`).test(src);
      if(/branch|transfer/i.test(k)||!used) console.log(`${used?"USED  ":"UNUSED"} ${k} = ${String(v).slice(0,60)}`);
    }
  };
  check(inv,"inventory.json");
  const bk=common.filter(([k])=>/branch/i.test(k));
  check(bk,"common.json branch keys");
}
