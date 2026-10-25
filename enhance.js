document.querySelectorAll('.category').forEach(card => {
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  const choose = () => {
    const name = card.querySelector('h3').textContent;
    const types = {'Mobiles & Tablets':'Mobile / Tablet','Computers':'Computer / Laptop','Accessories':'Charger / Cable','Home Electronics':'Printer / TV'};
    document.getElementById('pType').value = types[name] || 'Other';
    document.getElementById('pickup').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  };
  card.addEventListener('click', choose);
  card.addEventListener('keydown', e => {if(e.key === 'Enter' || e.key === ' '){e.preventDefault(); choose();}});
});
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.hash === '#' + entry.target.id));
    }
  });
}, {rootMargin:'-10% 0px -65% 0px'});
document.querySelectorAll('main section[id]').forEach(s => sectionObserver.observe(s));
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {if(entry.isIntersecting){entry.target.classList.add('reveal');revealObserver.unobserve(entry.target);}});
}, {threshold:.12});
document.querySelectorAll('.hero-text,.hero-art,.card,.timeline>div').forEach(el => revealObserver.observe(el));
document.querySelector('.menu').addEventListener('click', () => {
  document.querySelector('.menu').setAttribute('aria-expanded',document.getElementById('nav').classList.contains('open'));
});
document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>document.querySelector('.menu').setAttribute('aria-expanded','false')));
