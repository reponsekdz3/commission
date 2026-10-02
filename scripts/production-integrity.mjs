import {existsSync,readdirSync,readFileSync} from "node:fs";
import {join,relative} from "node:path";

const root=process.cwd();
const scanRoots=["apps/api/src","apps/web/app","apps/web/components","apps/web/hooks","apps/web/lib","apps/mobile/app","apps/mobile/src"];
const forbidden=[
  {label:"in-memory PlatformStore",re:/PlatformStore|legacy-test-store/gi},
  {label:"seeded demo store",re:/ChangeMe!2026|landlord@imizi\.rw|tenant@imizi\.rw|admin@imizi\.rw|agent@imizi\.rw/gi},
  {label:"explicit demo/mock runtime path",re:/from\s+["'][^"']*(?:platform\.store|mock|demo-store)[^"']*["']/gi},
];
const extensions=new Set([".ts",".tsx",".js",".jsx",".mjs",".cjs"]);
const hits=[];
function walk(dir){
  if(!existsSync(dir))return;
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    if(["node_modules",".next","dist","coverage"].includes(entry.name))continue;
    const path=join(dir,entry.name);
    if(entry.isDirectory())walk(path);
    else if(extensions.has(path.slice(path.lastIndexOf(".")))){
      const text=readFileSync(path,"utf8");
      for(const rule of forbidden){
        rule.re.lastIndex=0;
        if(rule.re.test(text))hits.push({file:relative(root,path).replaceAll("\\","/"),rule:rule.label});
      }
    }
  }
}
for(const rootPath of scanRoots)walk(join(root,rootPath));
if(existsSync(join(root,"apps/api/src/store/platform.store.ts")))hits.push({file:"apps/api/src/store/platform.store.ts",rule:"deleted production demo store still exists"});
if(hits.length){
  console.error("Production integrity scan failed:");
  for(const hit of hits)console.error("- "+hit.file+" => "+hit.rule);
  process.exit(1);
}
console.log("Production integrity scan passed.");
