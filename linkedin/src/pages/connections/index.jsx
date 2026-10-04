import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/layout/DashboardLayout";
import UserCard from "@/Components/UserCard";
import Avatar from "@/Components/Avatar";
import { UserCardSkeleton } from "@/Components/Skeleton";
import {
  fetchAllUsers,
  sendConnectionRequest,
  fetchSentRequests,
  fetchIncomingRequests,
  respondToRequest,
} from "@/config/redux/action/connectionAction";
import { fetchUserProfile } from "@/config/redux/action/profileAction";
import useAuthGuard from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import styles from "./style.module.css";

export default function ConnectionsPage() {
  const dispatch = useDispatch();
  const { users, sentRequests, incomingRequests, pendingIds, isLoading, message } = useSelector(
    (state) => state.connections
  );
  const { profile } = useSelector((state) => state.profile);
  const [tab, setTab] = useState("discover");
  const { t } = useI18n();

  useAuthGuard();

  const myId = profile?.userId?._id;

  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchAllUsers());
    dispatch(fetchSentRequests());
    dispatch(fetchIncomingRequests());
  }, [dispatch]);

  const acceptedFromSent = sentRequests
    .filter((r) => r.status_accepted === true)
    .map((r) => r.connectionId?._id || r.connectionId);

  const acceptedFromIncoming = incomingRequests
    .filter((r) => r.status_accepted === true)
    .map((r) => r.userId?._id || r.userId);

  const acceptedIds = [...acceptedFromSent, ...acceptedFromIncoming];

  const pendingIncoming = incomingRequests.filter((r) => r.status_accepted == null);

  const otherUsers = users.filter((u) => {
    const id = u.userId?._id;
    return id && id !== myId;
  });

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>{t("myNetwork")}</h1>

        <div className={styles.tabs}>
          <button
            className={tab === "discover" ? styles.tabActive : styles.tab}
            onClick={() => setTab("discover")}
          >
            {t("discover")}
          </button>
          <button
            className={tab === "incoming" ? styles.tabActive : styles.tab}
            onClick={() => setTab("incoming")}
          >
            {t("requests", { count: pendingIncoming.length })}
          </button>
          <button
            className={tab === "sent" ? styles.tabActive : styles.tab}
            onClick={() => setTab("sent")}
          >
            {t("sent", { count: sentRequests.length })}
          </button>
        </div>

        {message && <p className={styles.message}>{message}</p>}

        {tab === "discover" && (
          <div className={styles.list}>
            {isLoading ? (
              <>
                <UserCardSkeleton />
                <UserCardSkeleton />
                <UserCardSkeleton />
              </>
            ) : otherUsers.length === 0 ? (
              <p className={styles.loading}>{t("noUsersFound")}</p>
            ) : (
              otherUsers.map((u) => {
                const id = u.userId?._id;
                return (
                  <UserCard
                    key={id}
                    user={u}
                    profile={u}
                    onConnect={(connectionId) => dispatch(sendConnectionRequest(connectionId))}
                    isPending={pendingIds.includes(id)}
                    isConnected={acceptedIds.includes(id)}
                  />
                );
              })
            )}
          </div>
        )}

        {tab === "incoming" && (
          <div className={styles.list}>
            {pendingIncoming.length === 0 ? (
              <p className={styles.loading}>{t("noPendingRequests")}</p>
            ) : (
              pendingIncoming.map((req) => (
                <div key={req._id} className={styles.requestCard}>
                  <Avatar user={req.userId} size={48} />
                  <div className={styles.requestInfo}>
                    <p className={styles.requestName}>{req.userId?.name}</p>
                    <p className={styles.requestUser}>@{req.userId?.username}</p>
                  </div>
                  <div className={styles.requestActions}>
                    <button
                      className={styles.acceptBtn}
                      onClick={() =>
                        dispatch(respondToRequest({ requestId: req._id, action_type: "accept" }))
                      }
                    >
                      {t("accept")}
                    </button>
                    <button
                      className={styles.rejectBtn}
                      onClick={() =>
                        dispatch(respondToRequest({ requestId: req._id, action_type: "reject" }))
                      }
                    >
                      {t("decline")}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "sent" && (
          <div className={styles.list}>
            {sentRequests.length === 0 ? (
              <p className={styles.loading}>{t("noSentRequests")}</p>
            ) : (
              sentRequests.map((req) => (
                <div key={req._id} className={styles.requestCard}>
                  <Avatar user={req.connectionId} size={48} />
                  <div className={styles.requestInfo}>
                    <p className={styles.requestName}>{req.connectionId?.name}</p>
                    <p className={styles.requestUser}>@{req.connectionId?.username}</p>
                  </div>
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
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
