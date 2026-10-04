import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/layout/DashboardLayout";
import Avatar from "@/Components/Avatar";
import { clientServer } from "@/config";
import { getPublicProfilePath, getToken } from "@/config/utils";
import { getRelationship } from "@/config/connectionRelationship";
import {
  fetchIncomingRequests,
  fetchSentRequests,
  respondToRequest,
  sendConnectionRequest,
} from "@/config/redux/action/connectionAction";
import useAuthGuard from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import styles from "./style.module.css";

export default function PeopleSearchPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useI18n();
  const { pendingIds, sentRequests, incomingRequests, sentReady, incomingReady } = useSelector((state) => state.connections);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [respondingId, setRespondingId] = useState("");

  useAuthGuard();

  const query = typeof router.query.query === "string" ? router.query.query.trim() : "";

  useEffect(() => {
    dispatch(fetchSentRequests());
    dispatch(fetchIncomingRequests());
  }, [dispatch]);

  useEffect(() => {
    if (!router.isReady) return undefined;
    if (query.length < 3) {
      setPeople([]);
      setError("");
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    clientServer
      .get("/user/search_people", {
        params: { token: getToken(), query, limit: 50 },
      })
      .then((response) => {
        if (cancelled) return;
        setPeople(response.data.people || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setPeople([]);
        setError(err.response?.data?.message || t("searchFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router.isReady, query, t]);

  const relationshipOf = (userId) => getRelationship(userId, {
    pendingIds,
    sentRequests,
    incomingRequests,
    connectionsHydrated: Boolean(sentReady && incomingReady),
  });

  const openProfile = (username) => {
    const path = getPublicProfilePath(username);
    if (path) router.push(path);
  };

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <p className={styles.kicker}>{t("people")}</p>
            <h1 className={styles.title}>
              {query ? t("peopleResultsFor", { query }) : t("people")}
            </h1>
          </div>

          {query && query.length < 3 ? <p className={styles.empty}>{t("typeToSearch")}</p> : null}
          {loading ? <p className={styles.empty}>{t("loading")}</p> : null}
          {error ? <p className={styles.empty}>{error}</p> : null}
          {!loading && !error && query.length >= 3 && people.length === 0 ? (
            <p className={styles.empty}>{t("noSearchResults")}</p>
          ) : null}

          {!loading && people.map((person) => {
            const relationship = relationshipOf(person._id);
            const profilePath = getPublicProfilePath(person.username);
            return (
              <article key={person._id} className={styles.row}>
                <button
                  type="button"
                  className={styles.profileBtn}
                  onClick={() => openProfile(person.username)}
                  disabled={!profilePath}
                >
                  <Avatar user={person} size={56} />
                  <div className={styles.info}>
                    {person.name ? <p className={styles.name}>{person.name}</p> : null}
                    {person.headline ? <p className={styles.headline}>{person.headline}</p> : null}
                    {person.location ? <p className={styles.location}>{person.location}</p> : null}
                  </div>
                </button>

                <div className={styles.actions}>
                  {relationship.status === "incoming" ? (
                    <>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        disabled={respondingId === person._id}
                        onClick={() => {
                          if (!relationship.incomingRequest?._id) return;
                          setRespondingId(person._id);
                          dispatch(respondToRequest({
                            requestId: relationship.incomingRequest._id,
                            action_type: "accept",
                          })).finally(() => setRespondingId(""));
                        }}
                      >
                        {t("accept")}
                      </button>
                      <button
                        type="button"
                        className={styles.ghostBtn}
                        disabled={respondingId === person._id}
                        onClick={() => {
                          if (!relationship.incomingRequest?._id) return;
                          setRespondingId(person._id);
                          dispatch(respondToRequest({
                            requestId: relationship.incomingRequest._id,
                            action_type: "reject",
                          })).finally(() => setRespondingId(""));
                        }}
                      >
                        {t("decline")}
                      </button>
                    </>
                  ) : null}
                  {relationship.status === "outgoing" ? (
                    <button type="button" className={styles.outlineBtn} disabled>
                      {t("pending")}
                    </button>
                  ) : null}
                  {relationship.status === "connected" ? (
                    <button
                      type="button"
                      className={styles.outlineBtn}
                      onClick={() => router.push(`/messaging?userId=${person._id}`)}
                    >
                      {t("messageAction")}
                    </button>
                  ) : null}
                  {relationship.status === "none" ? (
                    <button
                      type="button"
                      className={styles.outlineBtn}
                      onClick={() => dispatch(sendConnectionRequest(person._id))}
                    >
                      {t("connect")}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
