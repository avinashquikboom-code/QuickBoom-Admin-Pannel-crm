/* Run against a local server. Uses installed Playwright or PLAYWRIGHT_MODULE. No API stubs. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const sizes = [[1920,1080],[1600,900],[1440,900],[1366,768],[1280,800],[1024,768],[768,1024],[600,900],[430,932],[390,844],[375,667],[320,568]];
function routes(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?routes(path.join(dir,e.name)):/^page\.(jsx|tsx)$/.test(e.name)?[('/'+path.dirname(path.join(dir,e.name)).replace(/^src\/app\//,''))]:[]).filter(r=>!r.includes('[')); }
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage(); const failures=[]; let checks=0;
 const navigation = fs.readFileSync('src/modules/sidebar/extra-navigation.js','utf8') + fs.readFileSync('src/modules/hrm/navigation.js','utf8');
 const allRoutes=[...new Set([...routes('src/app/admin'), ...Array.from(navigation.matchAll(/href: '(\/admin\/sections\/[^']+)'/g),m=>m[1])])];
 if(process.env.ROUTE_FILTER) allRoutes.splice(0,allRoutes.length,...allRoutes.filter(r=>r.includes(process.env.ROUTE_FILTER)));
 for(const route of allRoutes){
  await page.goto((process.env.BASE_URL||'http://localhost:3107')+route);
  await page.locator('#main-content:visible').first().waitFor();
  await page.waitForTimeout(250);
  for(const [width,height] of sizes){
   await page.setViewportSize({width,height}); await page.waitForTimeout(320);
   const issues=await page.evaluate(()=>{
    const main=[...document.querySelectorAll('#main-content')].find(el=>el.getClientRects().length),bounds=main.getBoundingClientRect();
    const result=[];
    if(document.documentElement.scrollWidth>innerWidth+1)result.push('document overflow');
    if(main.scrollWidth>main.clientWidth+1)result.push('main overflow');
    for(const el of main.querySelectorAll('button,input,select,[role="tablist"],h1,h2')){
     if(!el.getClientRects().length || el.closest('[aria-hidden="true"]') || el.closest('table,[data-slot="table-container"],.overflow-x-auto'))continue;
     const r=el.getBoundingClientRect();
     if(r.width && (r.right>bounds.right+1||r.left<bounds.left-1))result.push(el.tagName+':'+(el.textContent||el.getAttribute('placeholder')||'').slice(0,50));
    }
    return result;
   });
   if(issues.length)failures.push({route,width,issues:[...new Set(issues)]});checks++;
  }
  console.log(route+' checked');
 }
 await page.goto((process.env.BASE_URL||'http://localhost:3107')+'/admin/dashboard');
 await page.setViewportSize({width:320,height:568});
 await page.waitForTimeout(600);
 await page.getByRole('button',{name:'Open Navigation',exact:true}).click();
 await page.getByRole('dialog').waitFor();
 await page.getByRole('dialog').getByRole('link',{name:'Dashboard',exact:true}).click();
 await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByRole('button',{name:'Open Navigation',exact:true}).click();
 await page.mouse.click(315,300);await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByRole('button',{name:'Open search',exact:true}).click();
 await page.getByRole('button',{name:'Close search',exact:true}).click();

 await page.goto((process.env.BASE_URL||'http://localhost:3107')+'/admin/hrm/employees');
 await page.getByRole('button',{name:'Add Employee',exact:true}).click();
 const drawer=page.getByRole('dialog'); await drawer.waitFor();
 await page.waitForTimeout(400);
 for(const [width,height] of [...sizes,[390,400]]) {
  await page.setViewportSize({width,height}); await page.waitForTimeout(350);
  const issues=await drawer.evaluate(el=>{
   const r=el.getBoundingClientRect(), result=[];
   if(r.left < -1 || r.right > innerWidth+1 || r.top < -1 || r.bottom > innerHeight+1) result.push('drawer exceeds viewport');
   if(el.scrollWidth>el.clientWidth+1) result.push('drawer horizontal overflow');
   const close=el.querySelector('[aria-label="Close"]');
   if(close && close.getBoundingClientRect().bottom>innerHeight)result.push('close is clipped');
   return result;
  });
  if(issues.length) failures.push({route:'employee drawer',width,height,issues});
 }
 await page.keyboard.press('Escape'); await drawer.waitFor({state:'hidden'});
 fs.writeFileSync(process.env.RESULTS_PATH || '/tmp/qb-responsive-results.json',JSON.stringify({checks,routes:allRoutes.length,failures},null,2));
 console.log(JSON.stringify({checks,routes:allRoutes.length,failures},null,2));await browser.close();process.exitCode=failures.length?1:0;
})().catch(e=>{console.error(e);process.exit(1)});
