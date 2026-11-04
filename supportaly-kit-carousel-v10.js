(function(){
'use strict';
const section=document.querySelector('#inside.v6-kit');if(!section)return;
const rail=section.querySelector('.kit-carousel'),back=section.querySelector('[data-kit-prev]'),next=section.querySelector('[data-kit-next]'),modal=document.querySelector('#imageLightbox');
if(!rail||!back||!next)return;
function update(){let max=Math.max(0,rail.scrollWidth-rail.clientWidth);back.disabled=rail.scrollLeft<=3;next.disabled=rail.scrollLeft>=max-3}
function move(dir){let card=rail.querySelector('.kit-card');if(!card)return;let gap=parseFloat(getComputedStyle(rail).gap)||0;rail.scrollBy({left:dir*(card.getBoundingClientRect().width+gap),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
back.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
rail.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update,{passive:true});
rail.addEventListener('keydown',e=>{if(e.target.closest('.shop-dots,.shop-preview'))return;if(e.key==='ArrowRight'){e.preventDefault();move(1)}if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}});
section.querySelectorAll('.kit-card').forEach(card=>{
 const frames=[...card.querySelectorAll('.shop-image-page')],dots=[...card.querySelectorAll('.shop-dot')],art=card.querySelector('.shop-artwork'),zoom=card.querySelector('[data-pdf-zoom]'),title=card.querySelector('h3')?.textContent.trim()||'PDF';let active=0;
 function show(i){if(i<0||i>=frames.length)return;active=i;frames.forEach((f,n)=>{f.hidden=n!==i;f.setAttribute('aria-hidden',String(n!==i))});dots.forEach((d,n)=>d.setAttribute('aria-pressed',String(n===i)));art?.setAttribute('aria-label',title+(i?' inside page '+i:' cover'))}
 dots.forEach((d,i)=>d.addEventListener('click',()=>show(i)));
 if(art&&frames.length>1){let start=null;art.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')start=[e.clientX,e.clientY]});art.addEventListener('pointerup',e=>{if(!start)return;let dx=e.clientX-start[0],dy=e.clientY-start[1];start=null;if(Math.abs(dx)>30&&Math.abs(dx)>Math.abs(dy)*1.25)show(Math.min(frames.length-1,Math.max(0,active+(dx<0?1:-1))))})}
 if(zoom&&modal)zoom.addEventListener('click',()=>{const img=frames[active]?.querySelector('img'),target=modal.querySelector('img');if(!img||!target||!modal.showModal)return;target.src=img.getAttribute('src');target.alt=img.alt;const caption=modal.querySelector('.zoom-caption');if(caption)caption.textContent=title+(active?' — inside page '+active:' — cover');if(!modal.open)modal.showModal()});
 show(0);
});update();
})();
(function(){const section=document.querySelector('#inside.v6-kit');if(!section)return;const rail=section.querySelector('.kit-carousel');const buttons=[...section.querySelectorAll('[data-kit-filter]')];const cards=[...section.querySelectorAll('.kit-card[data-product-category]')];if(!rail||!buttons.length||!cards.length)return;function apply(value){cards.forEach(card=>{card.hidden=value!=='all'&&card.dataset.productCategory!==value});buttons.forEach(btn=>{const active=btn.dataset.kitFilter===value;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active))});rail.scrollTo({left:0,behavior:'auto'});rail.dispatchEvent(new Event('scroll'));}buttons.forEach(btn=>btn.addEventListener('click',()=>apply(btn.dataset.kitFilter)));apply('all');})();