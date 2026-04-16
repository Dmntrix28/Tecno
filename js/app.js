const state = {
  list: [],
  filtered: [],
  allPokemons: [],
};

let currentPage = 1;
const limit = 50;

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
    grid.innerHTML = '<p class="status">No hay resultados.</p>';
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

  document.querySelectorAll('.pokemon-card').forEach((card) => {
    card.addEventListener('click', () => {
      localStorage.setItem('selectedPokemon', card.dataset.name);
      window.location.href = 'detalle.html';
    });
  });
}

async function loadAllPokemons() {
  if (state.allPokemons.length) return;

  const data = await fetchPokemonList(1200, 0);
  state.allPokemons = data.results;
}

async function loadPage(page = 1) {
  const grid = document.getElementById('pokemonGrid');
  const offset = (page - 1) * limit;

  try {
    renderStatus('Cargando Pokédex...');
    grid.innerHTML = '';

    const data = await fetchPokemonList(limit, offset);

    state.list = data.results;
    state.filtered = data.results;

    renderPokemonCards(state.filtered);

    renderStatus(`Página ${page} - ${state.list.length} Pokémon`, false);
  } catch (error) {
    renderStatus(`Error: ${error.message}`, true);
  }
}

function renderPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;

  const totalPages = 20;
  container.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = 'page-btn';

    if (i === currentPage) btn.classList.add('active');

    btn.addEventListener('click', () => {
      currentPage = i;
      loadPage(currentPage);
      renderPagination();
    });

    container.appendChild(btn);
  }
}

// 🔥 SUGERENCIA SIMPLE (tipo "quisiste decir")
function suggestPokemon(term) {
  return state.allPokemons.find((p) =>
    p.name.includes(term[0])
  );
}

function initListPage() {
  loadPage(currentPage);
  renderPagination();
  loadAllPokemons();

  const searchInput = document.getElementById('searchInput');
  const reloadBtn = document.getElementById('reloadBtn');

  searchInput?.addEventListener('input', (event) => {
    const term = event.target.value.toLowerCase().trim();

    if (!term) {
      loadPage(currentPage);
      return;
    }

    const results = state.allPokemons.filter((p) =>
      p.name.includes(term)
    );

    if (results.length === 0) {
      const suggestion = suggestPokemon(term);
      renderStatus(
        suggestion
          ? `No encontrado. ¿Quisiste decir "${suggestion.name}"?`
          : 'No se encontraron resultados',
        true
      );
    } else {
      renderStatus(`Resultados: ${results.length}`, false);
    }

    renderPokemonCards(results.slice(0, 50));
  });

  reloadBtn?.addEventListener('click', () => {
    currentPage = 1;
    loadPage(currentPage);
    renderPagination();
  });
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
      'No hay Pokémon seleccionado.',
      true,
      'detailStatus'
    );
    return;
  }

  try {
    renderStatus(`Consultando ${selected}...`, false, 'detailStatus');
    const pokemon = await fetchPokemonDetailByName(selected);
    renderDetailCard(pokemon);
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