const state = {
  list: [],
  filtered: [],
  allPokemons: [],
};

let currentPage = 1;
const limit = 50;
let asc = true;

// 🔥 NUEVO
let isSorted = false;
let sortedList = [];

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

  try {
    renderStatus('Cargando Pokédex...');
    grid.innerHTML = '';

    if (isSorted) {
      const start = (page - 1) * limit;
      const end = start + limit;

      const pageData = sortedList.slice(start, end);

      state.list = pageData;
      state.filtered = pageData;

      renderPokemonCards(pageData);

      renderStatus(`Página ${page} (ordenado)`, false);
      return;
    }

    const offset = (page - 1) * limit;
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

  const totalPokemons = 1200;
  const totalPages = Math.ceil(totalPokemons / limit);

  container.innerHTML = '';

  // <
  const prev = document.createElement('button');
  prev.textContent = '<';
  prev.className = 'page-btn';
  prev.disabled = currentPage === 1;

  prev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      loadPage(currentPage);
      renderPagination();
    }
  };

  container.appendChild(prev);

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);

  if (start > 1) {
    addPageButton(1);

    if (start > 2) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      dots.style.padding = '8px';
      container.appendChild(dots);
    }
  }

  for (let i = start; i <= end; i++) {
    addPageButton(i);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      dots.style.padding = '8px';
      container.appendChild(dots);
    }

    addPageButton(totalPages);
  }

  // >
  const next = document.createElement('button');
  next.textContent = '>';
  next.className = 'page-btn';
  next.disabled = currentPage === totalPages;

  next.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadPage(currentPage);
      renderPagination();
    }
  };

  container.appendChild(next);

  function addPageButton(page) {
    const btn = document.createElement('button');
    btn.textContent = page;
    btn.className = 'page-btn';

    if (page === currentPage) btn.classList.add('active');

    btn.onclick = () => {
      currentPage = page;
      loadPage(currentPage);
      renderPagination();
    };

    container.appendChild(btn);
  }
}

function suggestPokemon(term) {
  return state.allPokemons.find((p) =>
    p.name.startsWith(term[0])
  );
}

function initListPage() {
  loadPage(currentPage);
  renderPagination();
  loadAllPokemons();

  const searchInput = document.getElementById('searchInput');
  const reloadBtn = document.getElementById('reloadBtn');
  const sortBtn = document.getElementById('sortBtn');

  // BUSCADOR
  searchInput?.addEventListener('input', (event) => {
    const term = event.target.value.toLowerCase().trim();

    if (!term) {
      isSorted = false;
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

  // RECARGAR
  reloadBtn?.addEventListener('click', () => {
    isSorted = false;
    currentPage = 1;
    loadPage(currentPage);
    renderPagination();
  });

  // ORDENAR (CORREGIDO)
  sortBtn?.addEventListener('click', () => {
    if (!isSorted) {
      sortedList = [...state.allPokemons].sort((a, b) => {
        return asc
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });

      isSorted = true;
    } else {
      sortedList.reverse();
    }

    asc = !asc;
    currentPage = 1;

    renderStatus(`Ordenado ${asc ? "A-Z" : "Z-A"}`, false);

    loadPage(currentPage);
    renderPagination();

    sortBtn.textContent = asc ? "Ordenar A-Z" : "Ordenar Z-A";
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
    renderStatus('No hay Pokémon seleccionado.', true, 'detailStatus');
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