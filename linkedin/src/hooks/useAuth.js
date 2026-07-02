import { useRouter } from "next/router";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getToken } from "@/config/utils";
import { setLoggedIn } from "@/config/redux/reducer/authReducer";

export default function useAuthGuard() {
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
    } else {
      dispatch(setLoggedIn(true));
    }
  }, [router, dispatch]);
}

export function useAuthCheck() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setLoggedIn(!!getToken()));
  }, [dispatch]);
}
