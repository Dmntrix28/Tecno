const state = {
  list: [],
  filtered: [],
};

function getIdFromUrl(url) {
  const parts = url.split('/').filter(Boolean);
  return Number(parts[parts.length - 1]);
}

function getSpriteById(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function renderStatus(message, isError = false, id = 'status') {
  const node = document.getElementById(id);
  if (!node) return;
  node.textContent = message;
  node.classList.toggle('error', isError);
}

function renderPokemonCards(items) {
  const grid = document.getElementById('pokemonGrid');
  if (!grid) return;

  if (!items.length) {
    grid.innerHTML = '<p class="status">No hay resultados para tu búsqueda.</p>';
    return;
  }

  grid.innerHTML = items
    .map((pokemon) => {
      const id = getIdFromUrl(pokemon.url);
      return `
      <article class="led-card pokemon-card" data-name="${pokemon.name}">
        <img class="sprite" src="${getSpriteById(id)}" alt="${pokemon.name}" loading="lazy" />
        <div class="meta">
          <h3>${pokemon.name}</h3>
          <span class="tag">#${id}</span>
        </div>
      </article>`;
    })
    .join('');

  const cards = grid.querySelectorAll('.pokemon-card');
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      goToDetail(card.dataset.name);
    });
  });
}

async function initListPage() {
  try {
    renderStatus('Cargando Pokédex...');
    const data = await fetchPokemonList(20, 0);
    state.list = data.results;
    state.filtered = data.results;
    renderPokemonCards(state.list);
    renderStatus(`Mostrando ${state.list.length} Pokémon.`, false);
  } catch (error) {
    renderStatus(`Error: ${error.message}`, true);
  }

  const searchInput = document.getElementById('searchInput');
  const reloadBtn = document.getElementById('reloadBtn');

  searchInput?.addEventListener('input', (event) => {
    const term = event.target.value.toLowerCase().trim();
    state.filtered = state.list.filter((p) => p.name.includes(term));
    renderPokemonCards(state.filtered);
    renderStatus(`Coincidencias: ${state.filtered.length}`, false);
  });

  reloadBtn?.addEventListener('click', initListPage);
}

function renderDetailCard(pokemon) {
  const detail = document.getElementById('pokemonDetail');
  if (!detail) return;

  const types = pokemon.types.map((t) => t.type.name);
  const stats = pokemon.stats
    .map((s) => `<li>${s.stat.name}: <strong>${s.base_stat}</strong></li>`)
    .join('');

  detail.innerHTML = `
    <article class="led-card detail-panel">
      <img class="detail-image" src="${pokemon.sprites.other['official-artwork'].front_default}" alt="${pokemon.name}" />
      <div>
        <h2>${pokemon.name} #${pokemon.id}</h2>
        <p><strong>Altura:</strong> ${pokemon.height}</p>
        <p><strong>Peso:</strong> ${pokemon.weight}</p>
        <div class="types">
          ${types.map((type) => `<span class="type-chip">${type}</span>`).join('')}
        </div>
        <h3>Estadísticas</h3>
        <ul class="stats-list">${stats}</ul>
      </div>
    </article>`;
}

async function initDetailPage() {
  const selected = localStorage.getItem('selectedPokemon');

  if (!selected) {
    renderStatus(
      'No hay Pokémon seleccionado. Vuelve a la lista y elige uno.',
      true,
      'detailStatus'
    );
    return;
  }

  try {
    renderStatus(`Consultando datos de ${selected}...`, false, 'detailStatus');
    const pokemon = await fetchPokemonDetailByName(selected);
    renderDetailCard(pokemon);
    renderStatus('Detalle cargado correctamente.', false, 'detailStatus');
  } catch (error) {
    renderStatus(`Error: ${error.message}`, true, 'detailStatus');
  }

  document.getElementById('backBtn')?.addEventListener('click', () => {
    window.location.href = 'lista.html';
  });
}

function initPage() {
  const page = document.body.dataset.page;
  if (page === 'lista') initListPage();
  if (page === 'detalle') initDetailPage();
}

document.addEventListener('DOMContentLoaded', initPage);
