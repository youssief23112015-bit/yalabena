const fs=require("fs"),path=require("path");
function walk(d,acc=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,acc);else if(/\.(ts|tsx)$/.test(e.name))acc.push(p);}return acc;}
const files=walk("src");
// gather all string literals that look like i18n keys
const used=new Set();
const re=/t\(\s*["'`]([^"'`]+)["'`]/g;
const re2=/["'`]([a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+)["'`]/g;
for(const f of files){const s=fs.readFileSync(f,"utf8");
  let m;while((m=re.exec(s)))used.add(m[1]);
  while((m=re2.exec(s)))used.add(m[1]);
}
// flatten json
function flat(o,p=""){const r={};for(const[k,v]of Object.entries(o)){const key=p?p+"."+k:k;if(v&&typeof v==="object"&&!Array.isArray(v))Object.assign(r,flat(v,key));else r[key]=v;}return r;}
for(const ns of ["common","hr","inventory"]){
 for(const lng of ["en","ar"]){
  const f=`src/locales/${lng}/${ns}.json`;
  if(!fs.existsSync(f))continue;
  const j=flat(JSON.parse(fs.readFileSync(f,"utf8")));
  const dead=Object.keys(j).filter(k=>{
    // direct match, or match with common. prefix, or as suffix after ns
    const cands=[k,`${ns}.${k}`,`common.${k}`,`${ns}.${k}`];
    return !cands.some(c=>used.has(c));
  });
  console.log(`--- ${lng}/${ns}.json  (${Object.keys(j).length} keys, ${dead.length} potentially unused) ---`);
  console.log(dead.join("\n"));
 }
}
