function setActiveNav() {
  const page = document.body.dataset.page;
  const links = document.querySelectorAll('.nav-link');

  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (
      (page === 'inicio' && href === 'index.html') ||
      (page === 'lista' && href === 'lista.html') ||
      (page === 'detalle' && href === 'lista.html')
    ) {
      link.classList.add('active');
    }
  });
}

function goToDetail(name) {
  localStorage.setItem('selectedPokemon', name);
  window.location.href = 'detalle.html';
}

document.addEventListener('DOMContentLoaded', setActiveNav);
