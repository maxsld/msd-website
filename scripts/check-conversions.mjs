// Vérification des conversions avec un formulaire et des messages Cal.com simulés.
// Toutes les requêtes sont interceptées : aucun contact réel ni événement GA4 envoyé.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch();const context=await browser.newContext();const events=[];let mockedSubmissions=0;
await context.exposeBinding('__captureEvent',(_,event)=>events.push(event));
await context.addInitScript(()=>{const list=[];list.push=function(...items){items.forEach(item=>window.__captureEvent(item));return Array.prototype.push.apply(this,items)};window.dataLayer=list;});
await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname==='msd-media.com'){let file=process.cwd()+u.pathname;if(file.endsWith('/'))file+='index.html';return route.fulfill({path:file})}if(u.hostname==='formspree.io'&&route.request().method()==='POST'){mockedSubmissions++;return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}',headers:{'access-control-allow-origin':'https://msd-media.com'}})}return route.abort()});
const page=await context.newPage();await page.goto('https://msd-media.com/creation-landing-page/',{referer:'https://www.google.com/search?q=creation+landing+page'});await page.locator('.site-footer a[href="https://msd-media.com/contact/"]').first().click();await page.waitForURL('https://msd-media.com/contact/');
const attr=await page.locator('input[name="source_visite"]').inputValue();assert.match(attr,/google\.com \/ organic/);assert.equal(await page.locator('input[name="page_entree"]').inputValue(),'/creation-landing-page/');
await page.selectOption('#besoin','landing-page');await page.fill('#nom','Test automatisé');await page.fill('#email','test@example.invalid');await page.fill('#message','Vérification locale, aucun message réel envoyé.');await page.check('#contact-consent');
await page.evaluate(()=>{const input=document.createElement('input');input.type='hidden';input.name='cf-turnstile-response';input.value='mock-local-only';document.querySelector('#contact-form').append(input)});
await page.locator('#contact-form button[type="submit"]').click();await page.waitForURL('https://msd-media.com/confirmation-contact/');
const leads=events.filter(e=>e.event==='lead_submit_success');assert.equal(leads.length,1);assert.equal(leads[0].acquisition_medium,'organic');assert.equal(leads[0].acquisition_landing,'/creation-landing-page/');assert.equal(mockedSubmissions,1);
await page.evaluate(()=>window.dispatchEvent(new MessageEvent('message',{origin:'https://fakecal.com',data:{type:'bookingSuccessful'}})));
assert.equal(events.filter(e=>e.event==='booking_completed').length,0);
await page.evaluate(()=>{for(let i=0;i<2;i++)window.dispatchEvent(new MessageEvent('message',{origin:'https://cal.com',data:{type:'bookingSuccessful'}}))});
await page.waitForFunction(()=>window.dataLayer.some(e=>e.event==='booking_completed'));
assert.equal(events.filter(e=>e.event==='booking_completed').length,1);
console.log(JSON.stringify({organicAttribution:attr,successfulFormEvent:leads.length,mockedSubmissions,bookingDeduplicated:true,untrustedBookingMessageIgnored:true,externalMessagesSent:0}));await browser.close();
