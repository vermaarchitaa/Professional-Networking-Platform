import React, { useEffect, useState } from "react";
import { searchGifs } from "@/config/redux/action/postAction";
import styles from "./styles.module.css";

export default function GifPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadGifs = async (value) => {
    setLoading(true);
    setError("");
    try {
      const data = await searchGifs(value);
      setGifs(data.gifs || []);
    } catch (err) {
      setGifs([]);
      setError(err.response?.data?.message || "GIF search is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGifs("");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadGifs(query);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className={styles.picker} role="dialog" aria-label="GIF picker">
      <div className={styles.header}>
        <input
          type="search"
          placeholder="Search GIFs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" onClick={onClose} aria-label="Close GIF picker">
          ✕
        </button>
      </div>
      {loading && <p className={styles.status}>Loading GIFs...</p>}
      {error && <p className={styles.status}>{error}</p>}
      <div className={styles.grid}>
        {gifs.map((gif) => (
          <button
            type="button"
            key={gif.id}
            className={styles.gifBtn}
            onClick={() => onSelect(gif.url)}
          >
            <img src={gif.preview || gif.url} alt={gif.description || "GIF"} />
          </button>
        ))}
      </div>
      <p className={styles.attribution}>Powered by GIPHY</p>
    </div>
  );
}
