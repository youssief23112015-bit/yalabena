const fs=require("fs");
for(const l of ["en","ar"]){const j=JSON.parse(fs.readFileSync(`src/locales/${l}/common.json`,"utf8"));console.log(l, JSON.stringify(j.public?.placementBook?.subtitle));}
