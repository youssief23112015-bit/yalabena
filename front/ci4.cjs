const fs=require("fs");
for(const lng of ["en","ar"]){
 const j=JSON.parse(fs.readFileSync(`src/locales/${lng}/common.json`,"utf8"));
 console.log(`=== ${lng}/common.json top-level namespaces ===`);
 console.log(Object.keys(j).join(", "));
 console.log(`--- ${lng} 'common' sub-namespace keys ---`);
 console.log(Object.keys(j.common||{}).join(", "));
 console.log(`--- ${lng} nav keys ---`);
 console.log(Object.keys(j.nav||{}).join(", "));
}
