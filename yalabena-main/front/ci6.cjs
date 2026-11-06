const fs=require("fs");
for(const lng of ["en","ar"]){
 const j=JSON.parse(fs.readFileSync(`src/locales/${lng}/common.json`,"utf8"));
 console.log(`=== ${lng} notifications ===`);
 console.log(JSON.stringify(j.notifications??null,null,1));
 console.log(`=== ${lng} public keys ===`);
 console.log(Object.keys(j.public||{}).join(", "));
}
