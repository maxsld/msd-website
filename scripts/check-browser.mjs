// Test du site généré : toutes les requêtes externes sont interceptées.
import { chromium } from 'playwright';
const root = process.cwd();
const browser = await chromium.launch({headless:true});
const result=[];
for(const width of [390,1440]) {
 const context=await browser.newContext({viewport:{width,height:900}});
 await context.route('**/*', async route=>{
  const u=new URL(route.request().url());
  if(['msd-media.com','127.0.0.1'].includes(u.hostname)) { let file=root+u.pathname; if(file.endsWith('/'))file+='index.html'; try { return await route.fulfill({path:file}); } catch (_) { return route.fulfill({status:404,body:'Not found'}); } }
  return route.abort();
 });
 for(const path of ['/','/creation-landing-page/','/realisations/','/tarifs/','/agence-web-annecy/','/creation-site-web-annecy/','/blog/','/blog/articles/combien-coute-landing-page-france-2026/','/blog/articles/site-internet-dentiste-ce-qui-est-autorise/','/realisations/merz-ultherapy-prime/','/outils/','/affiliation/','/contact/']) {
  const page=await context.newPage();const errors=[];const missing=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).hostname==='msd-media.com')missing.push(r.url())});
  await page.goto('https://msd-media.com'+path,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof window.msdTrack==='function');
  const data=await page.evaluate(()=>({title:document.title,h1:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth+2,bodyWidth:document.documentElement.scrollWidth,css:[...document.querySelectorAll('link[rel=stylesheet]')].map(n=>n.getAttribute('href'))}));
  let faq='none';
  const button=page.locator('.faq-question:visible').first(); if(await button.count()){ await button.click(); faq=await button.getAttribute('aria-expanded'); }
  result.push({path,width,...data,faq,errors,missing});await page.close();
 }
 await context.close();
}
await browser.close();
const failures=result.filter(r=>r.h1!==1||r.overflow||r.errors.length||r.missing.length||r.faq==='false');
console.log(failures.length ? JSON.stringify(failures,null,2) : `${result.length} vues mobile/ordinateur vérifiées : H1, ressources, FAQ et absence de débordement ou d’erreur JavaScript.`);
if(result.some(r=>r.h1!==1||r.overflow||r.errors.length||r.missing.length||r.faq==='false'))process.exit(1);
