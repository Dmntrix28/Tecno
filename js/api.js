const API_BASE = 'https://pokeapi.co/api/v2/pokemon';

async function fetchPokemonList(limit = 20, offset = 0) {
  const response = await fetch(`${API_BASE}?offset=${offset}&limit=${limit}`);
  if (!response.ok) {
    throw new Error(`No se pudo obtener el listado (${response.status})`);
  }
  return response.json();
}

async function fetchPokemonDetailByName(name) {
  const response = await fetch(`${API_BASE}/${name}`);
  if (!response.ok) {
    throw new Error(`No se pudo obtener detalle de ${name}`);
  }
  return response.json();
}
