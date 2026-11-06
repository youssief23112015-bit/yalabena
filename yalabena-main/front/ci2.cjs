const fs=require("fs");
for(const f of ["src/locales/en/common.json","src/locales/ar/common.json"]){
  const j=JSON.parse(fs.readFileSync(f,"utf8"));
  console.log("=== "+f+" common.inventory ===");
  console.log(JSON.stringify(j.inventory,null,1));
}
