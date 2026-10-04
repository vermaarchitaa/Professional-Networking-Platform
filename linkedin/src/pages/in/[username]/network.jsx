import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/layout/DashboardLayout";
import Avatar from "@/Components/Avatar";
import { clientServer } from "@/config";
import { getToken, getPublicProfilePath } from "@/config/utils";
import { sendConnectionRequest, fetchSentRequests, fetchIncomingRequests } from "@/config/redux/action/connectionAction";
import { getRelationship } from "@/config/connectionRelationship";
import useAuthGuard from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import styles from "./network.module.css";

export default function ProfileNetworkPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useI18n();
  const username = typeof router.query.username === "string" ? router.query.username : "";
  const { pendingIds, sentRequests, incomingRequests, sentReady, incomingReady } = useSelector((state) => state.connections);
  const [profiles, setProfiles] = React.useState([]);
  const [ownerName, setOwnerName] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  useAuthGuard();

  useEffect(() => {
    dispatch(fetchSentRequests());
    dispatch(fetchIncomingRequests());
  }, [dispatch]);

  useEffect(() => {
    if (!username) return undefined;
    let cancelled = false;
    setLoading(true);
    setError("");
    clientServer
      .post("/user/get_profile_connection_suggestions", { token: getToken(), username })
      .then((response) => {
        if (cancelled) return;
        setProfiles(response.data.profiles || []);
        setOwnerName(response.data.ownerName || "");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.message || "Failed to load suggestions");
        setProfiles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  const visibleProfiles = profiles.filter((entry) => {
    const relationship = getRelationship(entry.userId?._id, {
      pendingIds,
      sentRequests,
      incomingRequests,
      connectionsHydrated: Boolean(sentReady && incomingReady),
    });
    return relationship.status !== "connected" && relationship.status !== "incoming";
  });

  return (
    <DashboardLayout>
      <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t("connectionsYouMayKnow")}</h1>
        {ownerName ? <p className={styles.subtitle}>{ownerName}</p> : null}
        {loading ? <p className={styles.empty}>{t("loading")}</p> : null}
        {error ? <p className={styles.empty}>{error}</p> : null}
        {!loading && !error && visibleProfiles.length === 0 ? (
          <p className={styles.empty}>{t("noNetworkSuggestions")}</p>
        ) : null}
        {!loading && visibleProfiles.map((entry) => {
          const user = entry.userId;
          const id = user?._id;
          const headline = String(entry.currentPost || "").trim();
          const profilePath = getPublicProfilePath(user?.username);
          const relationship = getRelationship(id, {
            pendingIds,
            sentRequests,
            incomingRequests,
            connectionsHydrated: Boolean(sentReady && incomingReady),
          });
          const isPending = relationship.status === "outgoing";
          return (
            <article key={id} className={styles.row}>
              <button
                type="button"
                className={styles.profileBtn}
                onClick={() => profilePath && router.push(profilePath)}
              >
                <Avatar user={user} size={56} />
                <div className={styles.info}>
                  {user?.name ? <p className={styles.name}>{user.name}</p> : null}
                  {headline ? <p className={styles.headline}>{headline}</p> : null}
                </div>
              </button>
              <button
                type="button"
                className={styles.connectBtn}
                disabled={!id || isPending}
                onClick={() => id && !isPending && dispatch(sendConnectionRequest(id))}
              >
                {isPending ? t("pending") : t("connect")}
              </button>
            </article>
          );
        })}
      </div>
      </div>
    </DashboardLayout>
  );
}
