const fs=require("fs");
for(const f of ["src/locales/en/common.json","src/locales/ar/common.json"]){
  const j=JSON.parse(fs.readFileSync(f,"utf8"));
  console.log(f, "->", Object.keys(j).join(", "));
  console.log("   public:", Object.keys(j.public??{}).join(", "));
  console.log("   inventory keys:", Object.keys(j.inventory??{}).length);
}
