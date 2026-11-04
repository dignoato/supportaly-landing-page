(function(){
'use strict';
const dialog=document.querySelector('#checkoutDialog');
document.querySelectorAll('#inside .shop-buy').forEach(button=>{
 button.addEventListener('click',()=>{
   if(dialog?.showModal) dialog.showModal();
 });
});
})();