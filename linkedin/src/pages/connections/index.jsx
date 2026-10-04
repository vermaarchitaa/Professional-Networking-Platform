import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/layout/DashboardLayout";
import SuggestionCard from "@/Components/SuggestionCard";
import ConnectionRow from "@/Components/ConnectionRow";
import Avatar from "@/Components/Avatar";
import {
  fetchAllUsers,
  sendConnectionRequest,
  fetchSentRequests,
  fetchIncomingRequests,
  respondToRequest,
  removeConnection,
} from "@/config/redux/action/connectionAction";
import { fetchUserProfile } from "@/config/redux/action/profileAction";
import { getRelationship } from "@/config/connectionRelationship";
import { getPublicProfilePath } from "@/config/utils";
import useAuthGuard from "@/hooks/useAuth";
import { toIntlLocale, useI18n } from "@/i18n";
import styles from "./style.module.css";

const NETWORK_TABS = new Set(["discover", "connections", "incoming", "sent"]);

function objectIdTimestamp(id) {
  const hex = String(id || "");
  if (!/^[a-fA-F0-9]{8}/.test(hex)) return "";
  const date = new Date(parseInt(hex.slice(0, 8), 16) * 1000);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function connectionTimestamp(row) {
  if (row?.acceptedAt) return row.acceptedAt;
  if (row?.createdAt) return row.createdAt;
  return objectIdTimestamp(row?._id);
}

function requestCreatedAt(row) {
  if (row?.createdAt) return row.createdAt;
  return objectIdTimestamp(row?._id);
}

function formatNetworkDate(value, language) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(toIntlLocale(language), {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function headlineForUser(users, userId) {
  const profileEntry = users.find((entry) => String(entry.userId?._id) === String(userId || ""));
  return String(profileEntry?.currentPost || "").trim();
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default function ConnectionsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { users, sentRequests, incomingRequests, pendingIds, sentReady, incomingReady, isLoading, message } = useSelector(
    (state) => state.connections
  );
  const { profile } = useSelector((state) => state.profile);
  const [tab, setTab] = useState("discover");
  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState("");
  const { t, language } = useI18n();

  useAuthGuard();

  const myId = profile?.userId?._id;

  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchAllUsers());
    dispatch(fetchSentRequests());
    dispatch(fetchIncomingRequests());
  }, [dispatch]);

  useEffect(() => {
    if (!router.isReady) return;
    const next = String(router.query.tab || "discover");
    if (NETWORK_TABS.has(next) && next !== tab) setTab(next);
  }, [router.isReady, router.query.tab, tab]);

  const selectTab = (next) => {
    setTab(next);
    setOpenMenuId("");
    const href = next === "discover" ? "/connections" : `/connections?tab=${next}`;
    if (router.asPath !== href) router.replace(href, undefined, { shallow: true });
  };

  const relationshipOf = (userId) => getRelationship(userId, {
    pendingIds,
    sentRequests,
    incomingRequests,
    connectionsHydrated: Boolean(sentReady && incomingReady),
  });

  const acceptedIds = [
    ...sentRequests.filter((r) => r.status_accepted === true).map((r) => r.connectionId?._id || r.connectionId),
    ...incomingRequests.filter((r) => r.status_accepted === true).map((r) => r.userId?._id || r.userId),
  ].map(String);
  const acceptedCount = new Set(acceptedIds).size;
  const pendingIncoming = incomingRequests.filter((r) => r.status_accepted == null);

  const suggestions = users.filter((entry) => {
    const id = entry.userId?._id;
    if (!id) return false;
    const key = String(id);
    if (myId && key === String(myId)) return false;
    if (hiddenIds.has(key)) return false;
    const relationship = relationshipOf(id);
    if (relationship.status === "connected" || relationship.status === "incoming") return false;
    return true;
  });

  const openPublicProfile = (username) => {
    const path = getPublicProfilePath(username);
    if (path) router.push(path);
  };

  const acceptedConnections = [
    ...sentRequests
      .filter((row) => row.status_accepted === true)
      .map((row) => ({
        requestId: row._id,
        user: row.connectionId,
        acceptedAt: connectionTimestamp(row),
      })),
    ...incomingRequests
      .filter((row) => row.status_accepted === true)
      .map((row) => ({
        requestId: row._id,
        user: row.userId,
        acceptedAt: connectionTimestamp(row),
      })),
  ]
    .filter((row, index, list) => {
      const id = String(row.user?._id || "");
      return id && list.findIndex((item) => String(item.user?._id) === id) === index;
    })
    .map((row) => {
      const profileEntry = users.find((entry) => String(entry.userId?._id) === String(row.user?._id));
      return {
        ...row,
        headline: String(profileEntry?.currentPost || "").trim(),
      };
    })
    .sort((a, b) => new Date(b.acceptedAt || 0) - new Date(a.acceptedAt || 0));

  const searchValue = search.trim().toLowerCase();
  const visibleConnections = searchValue
    ? acceptedConnections.filter((row) => String(row.user?.name || "").toLowerCase().includes(searchValue))
    : acceptedConnections;

  const hideSuggestion = (userId) => {
    setHiddenIds((current) => {
      const next = new Set(current);
      next.add(String(userId));
      return next;
    });
  };

  return (
    <DashboardLayout>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.manageCard}>
            <h2 className={styles.manageTitle}>{t("manageMyNetwork")}</h2>
            <button
              type="button"
              className={`${styles.manageRow} ${tab === "connections" ? styles.manageRowActive : ""}`}
              onClick={() => selectTab("connections")}
            >
              <span className={styles.manageLabel}>
                <UsersIcon />
                {t("connections")}
              </span>
              <span className={styles.manageCount}>{acceptedCount}</span>
            </button>
          </div>
        </aside>

        <section className={styles.main}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={tab === "discover" ? styles.tabActive : styles.tab}
              onClick={() => selectTab("discover")}
            >
              {t("discover")}
            </button>
            <button
              type="button"
              className={tab === "incoming" ? styles.tabActive : styles.tab}
              onClick={() => selectTab("incoming")}
            >
              {t("requests", { count: pendingIncoming.length })}
            </button>
            <button
              type="button"
              className={tab === "sent" ? styles.tabActive : styles.tab}
              onClick={() => selectTab("sent")}
            >
              {t("sent", { count: sentRequests.length })}
            </button>
          </div>

          {message ? <p className={styles.message}>{message}</p> : null}

          {tab === "connections" && (
            <div className={styles.connectionsCard}>
              <h2 className={styles.sectionTitle}>{t("connectionsCount", { count: acceptedCount })}</h2>
              <div className={styles.toolbar}>
                <input
                  type="search"
                  className={styles.search}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("searchByName")}
                />
              </div>
              {visibleConnections.length === 0 ? (
                <p className={styles.empty}>{t("noConnectionsFound")}</p>
              ) : (
                visibleConnections.map((row) => (
                  <ConnectionRow
                    key={row.requestId}
                    user={row.user}
                    headline={row.headline}
                    acceptedAt={row.acceptedAt}
                    menuOpen={openMenuId === row.requestId}
                    onToggleMenu={() => setOpenMenuId((current) => (current === row.requestId ? "" : row.requestId))}
                    onCloseMenu={() => setOpenMenuId("")}
                    onRemove={() => {
                      setOpenMenuId("");
                      dispatch(removeConnection(row.user._id));
                    }}
                  />
                ))
              )}
            </div>
          )}

          {tab === "discover" && (
            <div className={styles.suggestionsCard}>
              <h2 className={styles.sectionTitle}>{t("connectionsYouMayKnow")}</h2>
              {isLoading ? (
                <div className={styles.grid}>
                  <div className={styles.skeleton} />
                  <div className={styles.skeleton} />
                  <div className={styles.skeleton} />
                  <div className={styles.skeleton} />
                </div>
              ) : suggestions.length === 0 ? (
                <p className={styles.empty}>{t("noNewConnections")}</p>
              ) : (
                <div className={styles.grid}>
                  {suggestions.map((entry) => {
                    const id = entry.userId?._id;
                    const relationship = relationshipOf(id);
                    return (
                      <SuggestionCard
                        key={id}
                        user={entry}
                        profile={entry}
                        onConnect={(connectionId) => dispatch(sendConnectionRequest(connectionId))}
                        onDismiss={hideSuggestion}
                        isPending={relationship.status === "outgoing"}
                        isConnected={relationship.status === "connected"}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "incoming" && (
            <div className={styles.listCard}>
              {pendingIncoming.length === 0 ? (
                <p className={styles.empty}>{t("noPendingRequests")}</p>
              ) : (
                pendingIncoming.map((req) => {
                  const headline = headlineForUser(users, req.userId?._id || req.userId);
                  const receivedLabel = formatNetworkDate(requestCreatedAt(req), language);
                  return (
                  <div key={req._id} className={styles.requestCard}>
                    <button
                      type="button"
                      className={styles.requestProfile}
                      onClick={() => openPublicProfile(req.userId?.username)}
                    >
                      <Avatar user={req.userId} size={56} />
                      <div className={styles.requestInfo}>
                        {req.userId?.name ? <p className={styles.requestName}>{req.userId.name}</p> : null}
                        {headline ? <p className={styles.requestHeadline}>{headline}</p> : null}
                        {receivedLabel ? <p className={styles.requestDate}>{t("receivedOn", { date: receivedLabel })}</p> : null}
                      </div>
                    </button>
                    <div className={styles.requestActions}>
                      <button
                        type="button"
                        className={styles.acceptBtn}
                        onClick={() =>
                          dispatch(respondToRequest({ requestId: req._id, action_type: "accept" }))
                        }
                      >
                        {t("accept")}
                      </button>
                      <button
                        type="button"
                        className={styles.rejectBtn}
                        onClick={() =>
                          dispatch(respondToRequest({ requestId: req._id, action_type: "reject" }))
                        }
                      >
                        {t("decline")}
                      </button>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "sent" && (
            <div className={styles.listCard}>
              {sentRequests.length === 0 ? (
                <p className={styles.empty}>{t("noSentRequests")}</p>
              ) : (
                sentRequests.map((req) => {
                  const headline = headlineForUser(users, req.connectionId?._id || req.connectionId);
                  const sentLabel = formatNetworkDate(requestCreatedAt(req), language);
                  return (
                  <div key={req._id} className={styles.requestCard}>
                    <button
                      type="button"
                      className={styles.requestProfile}
                      onClick={() => openPublicProfile(req.connectionId?.username)}
                    >
                      <Avatar user={req.connectionId} size={56} />
                      <div className={styles.requestInfo}>
                        {req.connectionId?.name ? <p className={styles.requestName}>{req.connectionId.name}</p> : null}
                        {headline ? <p className={styles.requestHeadline}>{headline}</p> : null}
                        {sentLabel ? <p className={styles.requestDate}>{t("sentOn", { date: sentLabel })}</p> : null}
                      </div>
                    </button>
                    <span
                      className={
                        req.status_accepted === true
                          ? styles.statusAccepted
                          : req.status_accepted === false
                            ? styles.statusRejected
                            : styles.statusPending
                      }
                    >
                      {req.status_accepted === true
                        ? t("accepted")
                        : req.status_accepted === false
                          ? t("declined")
                          : t("pending")}
                    </span>
                  </div>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
