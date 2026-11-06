const fs=require("fs"),path=require("path");
function walk(d,acc=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,acc);else if(/\.(ts|tsx)$/.test(e.name))acc.push(p);}return acc;}
const files=walk("src");
let used=new Set();
for(const f of files){
  const src=fs.readFileSync(f,"utf8");
  const re=/\b(?:t|tc|ti|tcommon)\(\s*[`"'"'"']([A-Za-z0-9_.]+)[`"'"'"']/g;
  let m;while((m=re.exec(src)))used.add(m[1]);
}
const flat=(o,pre="")=>Object.entries(o).flatMap(([k,v])=>typeof v==="object"&&v!==null?flat(v,pre+k+"."):[pre+k]);
for(const ns of ["common","hr","inventory"]){
  for(const lng of ["en","ar"]){
    const f=`src/locales/${lng}/${ns}.json`;
    if(!fs.existsSync(f))continue;
    const keys=flat(JSON.parse(fs.readFileSync(f,"utf8")));
    const unused=keys.filter(k=>!used.has(k)&&!used.has(k.split(".").pop())&&!used.has(k.replace(`${ns}.`,"")));
    console.log(`\n=== ${lng}/${ns}.json  total=${keys.length} unused=${unused.length} ===`);
    console.log(unused.join("\n"));
  }
}
