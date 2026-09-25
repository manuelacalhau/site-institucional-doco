'use strict';
const config = window.COMMUNITY_CONFIG || {};
const dialog = document.querySelector('#join-dialog');
const validInvite = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+(?:\?.*)?$/.test(config.whatsappUrl || '');
// Eventos locais, sem cookies, identificadores pessoais ou envio para terceiros.
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({ event: 'growth_page_view', page_id: 'comunidade-nova-psicologia' });
document.querySelectorAll('[data-join]').forEach(link => {
  if (validInvite) {
    link.href = config.whatsappUrl;
    link.rel = 'noopener noreferrer';
  }
  link.addEventListener('click', event => {
    if (!validInvite) {
      event.preventDefault();
      dialog.showModal();
      return;
    }
    window.dataLayer.push({ event: 'community_invite_click', location: link.dataset.location });
  });
});
if (validInvite) document.querySelector('.join-status').textContent = 'Entrada gratuita · O botão abre o convite no WhatsApp.';
dialog.querySelectorAll('button').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
document.querySelectorAll('.faq button').forEach(button => {
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    const answer = document.getElementById(button.getAttribute('aria-controls'));
    answer.inert = !open;
    answer.classList.toggle('open', open);
  });
});
