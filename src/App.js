import { useMemo, useRef, useState } from "react";
import "./App.css";
import { fetchPokemonSpecies } from "./api/pokeapi";

function pickEnglishFlavorText(entries = []) {
  const english = entries.filter((e) => e.language?.name === "en");
  if (!english.length) return "";
  return english[0].flavor_text?.replace(/\f|\n/g, " ").trim() || "";
}

function App() {
  const [query, setQuery] = useState("");
  const [pokemon, setPokemon] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const abortRef = useRef(null);

  const maxId = 1025;
  const randomId = useMemo(
    () => Math.floor(Math.random() * maxId) + 1,
    [pokemon]
  );

  async function loadSpecies(idOrName) {
    try {
      setError("");
      setStatus("loading");
      setPokemon(null);

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const data = await fetchPokemonSpecies(idOrName, {
        signal: abortRef.current.signal,
      });

      setPokemon(data);
      setStatus("success");
    } catch (e) {
      if (e.name === "AbortError") return;
      setStatus("error");
      setError(e.message || "Something went wrong");
    }
  }

  function onSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    loadSpecies(query);
  }

  function onRandom() {
    loadSpecies(randomId);
  }

  const flavor = pokemon
    ? pickEnglishFlavorText(pokemon.flavor_text_entries)
    : "";

  return (
    <div className="page">
      <header className="header">
        <h1>Pokémon Randomiser</h1>
        <p>Generate a random Pokémon or search by name/ID.</p>
      </header>

      <main className="main">
        <form className="card controls" onSubmit={onSearch}>
          <label className="label">
            Search (name or ID)
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. pikachu or 25"
            />
          </label>

          <div className="buttonRow">
            <button
              className="btn"
              type="submit"
              disabled={status === "loading"}
            >
              Search
            </button>
            <button
              className="btn"
              type="button"
              onClick={onRandom}
              disabled={status === "loading"}
            >
              Random Pokémon
            </button>
          </div>

          {status === "loading" && <p>Loading…</p>}
          {status === "error" && <p className="error">Error: {error}</p>}
        </form>

        <div className="card">
          {!pokemon && status !== "loading" && <p>No Pokémon loaded yet.</p>}

          {pokemon && (
            <div>
              <h2 className="title">
                #{pokemon.id} — {pokemon.name}
              </h2>

              <p>
                <strong>Generation:</strong> {pokemon.generation?.name}
              </p>

              <p>
                <strong>Color:</strong> {pokemon.color?.name}
              </p>

              <p>
                <strong>Shape:</strong> {pokemon.shape?.name}
              </p>

              <p>
                <strong>Capture rate:</strong> {pokemon.capture_rate}
              </p>

              <p>
                <strong>Base happiness:</strong> {pokemon.base_happiness}
              </p>

              <p>
                <strong>Legendary:</strong> {String(pokemon.is_legendary)} ·{" "}
                <strong>Mythical:</strong> {String(pokemon.is_mythical)} ·{" "}
                <strong>Baby:</strong> {String(pokemon.is_baby)}
              </p>

              {flavor && (
                <p>
                  <strong>Flavor text:</strong> {flavor}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
