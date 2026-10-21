const fs=require("fs");
for(const lng of ["en","ar"]){
 const j=JSON.parse(fs.readFileSync(`src/locales/${lng}/common.json`,"utf8"));
 console.log(`=== ${lng} public.placementBook ===`);
 console.log(JSON.stringify(j.public?.placementBook??null,null,1));
}
