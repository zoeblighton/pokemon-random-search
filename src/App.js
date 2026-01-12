import { useRef, useState } from "react";
import "./App.css";
import { fetchPokemon, fetchPokemonSpecies } from "./api/pokeapi";

function pickEnglishFlavorText(entries = []) {
  const english = entries.filter((e) => e.language?.name === "en");
  if (!english.length) return "";
  return english[0].flavor_text?.replace(/\f|\n/g, " ").trim() || "";
}

function normalizeName(name = "") {
  return String(name).toLowerCase().trim();
}

function App() {
  const [query, setQuery] = useState("");
  const [pokemon, setPokemon] = useState(null); // species data
  const [pokemonDetails, setPokemonDetails] = useState(null); // /pokemon data
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");

  // NEW: party/team of up to 6
  const [party, setParty] = useState([]);

  const abortRef = useRef(null);

  const maxId = 1025;

  async function loadSpecies(idOrName) {
    try {
      setError("");
      setStatus("loading");
      setPokemon(null);
      setPokemonDetails(null);

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const [speciesData, pokemonData] = await Promise.all([
        fetchPokemonSpecies(idOrName, { signal: abortRef.current.signal }),
        fetchPokemon(idOrName, { signal: abortRef.current.signal }),
      ]);

      setPokemon(speciesData);
      setPokemonDetails(pokemonData);
      setStatus("success");

      return { speciesData, pokemonData };
    } catch (e) {
      if (e.name === "AbortError") return null;
      setStatus("error");
      setError(e.message || "Something went wrong");
      return null;
    }
  }

  function addToParty(speciesData, pokemonData) {
    const sprite =
      pokemonData?.sprites?.other?.["official-artwork"]?.front_default ||
      pokemonData?.sprites?.front_default ||
      "";

    const types = pokemonData?.types
      ? pokemonData.types
          .slice()
          .sort((a, b) => a.slot - b.slot)
          .map((t) => t.type.name)
      : [];

    const entry = {
      id: speciesData.id,
      name: speciesData.name,
      sprite,
      types,
    };

    setParty((prev) => {
      // prevent duplicates by ID (optional, but feels game-like)
      const withoutDupes = prev.filter((p) => p.id !== entry.id);

      // push to end, keep last 6
      const next = [...withoutDupes, entry];
      return next.slice(-6);
    });
  }

  async function onSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    await loadSpecies(query);
  }

  async function onRandom() {
    const id = Math.floor(Math.random() * maxId) + 1;
    const result = await loadSpecies(id);

    if (result?.speciesData && result?.pokemonData) {
      addToParty(result.speciesData, result.pokemonData);
    }
  }

  async function onClickPartyMember(member) {
    // load by id or name; id is safest
    await loadSpecies(member.id);
  }

  function clearParty() {
    setParty([]);
  }

  const flavor = pokemon
    ? pickEnglishFlavorText(pokemon.flavor_text_entries)
    : "";

  const sprite =
    pokemonDetails?.sprites?.other?.["official-artwork"]?.front_default ||
    pokemonDetails?.sprites?.front_default ||
    "";

  const types = pokemonDetails?.types
    ? pokemonDetails.types
        .slice()
        .sort((a, b) => a.slot - b.slot)
        .map((t) => t.type.name)
    : [];

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

        <div className="card gameboy">
          {!pokemon && status !== "loading" && <p>No Pokémon loaded yet.</p>}

          {pokemon && pokemonDetails && (
            <div className="pokemonCard">
              <div className="pokemonTop">
                {sprite && (
                  <img
                    className="sprite"
                    src={sprite}
                    alt={pokemon.name}
                    loading="lazy"
                  />
                )}

                <div className="pokemonHeading">
                  <h2 className="title">
                    #{pokemon.id} — {pokemon.name}
                  </h2>

                  {types.length > 0 && (
                    <div className="typeRow">
                      {types.map((t) => (
                        <span
                          key={t}
                          className={`typeBadge type-${normalizeName(t)}`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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

          {/* PARTY (6 slots) */}
          <div className="party">
            <div className="partyHeader">
              <h3 className="partyTitle">Party</h3>
              <button
                className="btn partyBtn"
                type="button"
                onClick={clearParty}
              >
                Clear
              </button>
            </div>

            <div className="partyGrid">
              {Array.from({ length: 6 }).map((_, idx) => {
                const member = party[idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`partySlot ${member ? "filled" : "empty"}`}
                    onClick={() => member && onClickPartyMember(member)}
                    disabled={!member}
                    title={member ? member.name : "Empty slot"}
                  >
                    {member ? (
                      <>
                        {member.sprite ? (
                          <img
                            className="partySprite"
                            src={member.sprite}
                            alt={member.name}
                            loading="lazy"
                          />
                        ) : (
                          <div className="partySpritePlaceholder" />
                        )}
                        <div className="partyName">{member.name}</div>
                      </>
                    ) : (
                      <div className="partyEmpty">—</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
