import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { clientServer } from "@/config";
import { getPublicProfilePath, getToken } from "@/config/utils";
import Avatar from "@/Components/Avatar";
import { SearchIcon } from "@/Components/Navbar/icons";
import { useI18n } from "@/i18n";
import styles from "./styles.module.css";

const DEBOUNCE_MS = 350;
const DROPDOWN_LIMIT = 6;

function truncateHeadline(value) {
  const text = String(value || "").trim();
  if (text.length <= 72) return text;
  return `${text.slice(0, 71).replace(/\s+\S*$/, "")}…`;
}

export default function PeopleSearch() {
  const router = useRouter();
  const { t } = useI18n();
  const wrapRef = useRef(null);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [people, setPeople] = useState([]);

  useEffect(() => {
    if (router.pathname.startsWith("/search") && typeof router.query.query === "string") {
      setValue(router.query.query);
    }
  }, [router.pathname, router.query.query]);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 3) {
      setPeople([]);
      setError("");
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      clientServer
        .get("/user/search_people", {
          params: { token: getToken(), query, limit: DROPDOWN_LIMIT },
        })
        .then((response) => {
          if (cancelled) return;
          setPeople(response.data.people || []);
          setError("");
        })
        .catch((err) => {
          if (cancelled) return;
          setPeople([]);
          setError(err.response?.data?.message || t("searchFailed"));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, t]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [router.asPath]);

  const query = value.trim();
  const showDropdown = open && query.length >= 3;
  const resultsHref = `/search/people?query=${encodeURIComponent(query)}`;

  const openProfile = (username) => {
    const path = getPublicProfilePath(username);
    if (!path) return;
    setOpen(false);
    router.push(path);
  };

  const openAllResults = () => {
    if (query.length < 3) return;
    setOpen(false);
    router.push(resultsHref);
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <label className={styles.field}>
        <span className={styles.icon} aria-hidden="true">
          <SearchIcon size={16} />
        </span>
        <input
          type="search"
          className={styles.input}
          value={value}
          placeholder={t("searchPlaceholder")}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              openAllResults();
            }
          }}
          aria-label={t("searchPlaceholder")}
        />
      </label>

      {showDropdown ? (
        <div className={styles.dropdown} role="listbox">
          {loading ? <p className={styles.status}>{t("loading")}</p> : null}
          {error ? <p className={styles.status}>{error}</p> : null}
          {!loading && !error && people.length === 0 ? (
            <p className={styles.status}>{t("noSearchResults")}</p>
          ) : null}
          {!loading && people.map((person) => {
            const headline = truncateHeadline(person.headline);
            return (
              <button
                type="button"
                key={person._id}
                className={styles.row}
                onClick={() => openProfile(person.username)}
              >
                <Avatar user={person} size={40} />
                <div className={styles.info}>
                  {person.name ? <p className={styles.name}>{person.name}</p> : null}
                  {headline ? <p className={styles.headline}>{headline}</p> : null}
                </div>
              </button>
            );
          })}
          {!loading && query.length >= 3 ? (
            <button type="button" className={styles.seeAll} onClick={openAllResults}>
              {t("seeAllResults")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
