import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { getToken } from "@/config/utils";
import { fetchUnreadCount, fetchNotifications } from "@/config/redux/action/notificationAction";

const POLL_INTERVAL = 20000;

export default function useNotificationPoll(isLoggedIn) {
  const dispatch = useDispatch();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn || !getToken()) return;

    dispatch(fetchUnreadCount());

    intervalRef.current = setInterval(() => {
      dispatch(fetchUnreadCount());
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [dispatch, isLoggedIn]);
}

export function useFetchNotificationsOnOpen(isOpen, isLoggedIn) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (isOpen && isLoggedIn && getToken()) {
      dispatch(fetchNotifications());
    }
  }, [isOpen, isLoggedIn, dispatch]);
}
