
/* Supportaly Clarity Check / one question at a time. */
(function(){
 const tool=document.querySelector('[data-clarity-tool]');if(!tool)return;
 const q=Array.from(tool.querySelectorAll('[data-question]'));
 const list=tool.querySelector('.question-list'),card=tool.querySelector('.score-card');
 const val=tool.querySelector('[data-score]'),msg=tool.querySelector('[data-score-message]');
 if(q.length!==5||!list||!card||!val||!msg)return;
 const ans=q.map(x=>x.dataset.answer||'');let current=0;
 const progress=document.createElement('div');progress.className='clarity-progress';progress.setAttribute('aria-label','Your progress');
 const number=document.createElement('span');number.className='progress-text';
 const segments=document.createElement('div');segments.className='progress-segments';
 const bars=q.map(()=>{const s=document.createElement('span');segments.appendChild(s);return s});
 progress.append(number,segments);list.before(progress);
 const actions=document.createElement('div');actions.className='onboarding-actions';
 const back=document.createElement('button');back.type='button';back.className='onboard-back';back.textContent='← Back';
 const next=document.createElement('button');next.type='button';next.className='onboard-next';next.textContent='Continue →';
 actions.append(back,next);list.after(actions);
 const restart=document.createElement('button');restart.type='button';restart.className='onboard-restart';restart.textContent='Review my answers ↑';card.appendChild(restart);
 const descriptions=[
  'Your project is taking shape. Start by defining what you want and listing the questions that need professional advice.',
  'You already have some useful information. Bringing the remaining ideas and limits together can help you prepare for your first meeting.',
  'Some parts of your brief are clear. Identify the remaining uncertainties so you know what to discuss with your architect or geometra.',
  'You have thought through several important points. Now make the remaining assumptions and questions visible before design work begins.',
  'Most of your starting information is in place. One area may still deserve attention before your first professional meeting.',
  'You have considered all five areas. The next step is to organise your answers into a brief that can be reviewed with your Italian professional.'
 ];
 function render(focus){
  const done=current===5;
  list.hidden=done;actions.hidden=done;card.hidden=!done;
  number.textContent=done?'YOUR SNAPSHOT':'QUESTION '+String(current+1).padStart(2,'0')+' / 05';
  bars.forEach((b,i)=>{b.classList.toggle('is-complete',Boolean(ans[i]));b.classList.toggle('is-current',!done&&i===current)});
  q.forEach((item,i)=>{item.hidden=done||i!==current;item.querySelectorAll('button[data-value]').forEach(b=>b.setAttribute('aria-pressed',String(ans[i]===b.dataset.value)))});
  back.disabled=current===0;next.disabled=done||!ans[current];next.textContent=current===4?'View my starting point →':'Continue →';
  if(done){const score=ans.filter(v=>v==='yes').length;val.textContent=score+' / 5';msg.textContent=descriptions[score]}
  if(focus){const target=done?card.querySelector('p'):q[current].querySelector('button[data-value]');if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true})}}
 }
 q.forEach((item,i)=>item.querySelectorAll('button[data-value]').forEach(button=>{button.addEventListener('click',()=>{ans[i]=button.dataset.value;render(false)})}));
 back.addEventListener('click',()=>{if(current>0){current--;render(true)}});
 next.addEventListener('click',()=>{if(current<5&&ans[current]){current++;render(true)}});
 restart.addEventListener('click',()=>{current=0;render(true)});
 render(false);
})();

(function(){
 const modal=document.querySelector('#imageLightbox');
 if(!modal)return;
 document.querySelectorAll('.v6-kit .kit-card').forEach(card=>{
  const btn=card.querySelector('[data-shop-preview]');
  const image=card.querySelector('.shop-artwork img');
  const title=card.querySelector('h3');
  if(!btn||!image||!title)return;
  btn.addEventListener('click',()=>{
   const zoom=modal.querySelector('img');
   if(!zoom||!modal.showModal)return;
   zoom.src=image.getAttribute('src');
   zoom.alt=image.alt;
   const caption=modal.querySelector('.zoom-caption');
   if(caption)caption.textContent=title.textContent;
   modal.showModal();
  });
 });
})();
