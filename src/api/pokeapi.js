const BASE = "https://pokeapi.co/api/v2";

export async function fetchPokemonSpecies(idOrName, { signal } = {}) {
  const safe = String(idOrName).toLowerCase().trim();
  const url = `${BASE}/pokemon-species/${encodeURIComponent(safe)}/`;

  const res = await fetch(url, { signal });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Pokémon not found. Try a name (pikachu) or ID (25).");
    }
    throw new Error(`PokeAPI error (${res.status})`);
  }

  return res.json();
}
