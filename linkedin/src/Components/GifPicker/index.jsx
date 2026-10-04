import React, { useEffect, useState } from "react";
import { searchGifs } from "@/config/redux/action/postAction";
import { tMessage, useI18n } from "@/i18n";
import styles from "./styles.module.css";

export default function GifPicker({ onSelect, onClose }) {
  const { t } = useI18n();
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
      setError(err.response?.data?.message || "gifSearchUnavailable");
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
    <div className={styles.picker} role="dialog" aria-label={t("gifPicker")}>
      <div className={styles.header}>
        <input
          type="search"
          placeholder={t("searchGifs")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" onClick={onClose} aria-label={t("closeGifPicker")}>
          ✕
        </button>
      </div>
      {loading && <p className={styles.status}>{t("loadingGifs")}</p>}
      {error && <p className={styles.status}>{tMessage(t, error)}</p>}
      <div className={styles.grid}>
        {gifs.map((gif) => (
          <button
            type="button"
            key={gif.id}
            className={styles.gifBtn}
            onClick={() => onSelect(gif.url)}
          >
            <img src={gif.preview || gif.url} alt={gif.description || t("gif")} />
          </button>
        ))}
      </div>
      <p className={styles.attribution}>{t("poweredByGiphy")}</p>
    </div>
  );
}
