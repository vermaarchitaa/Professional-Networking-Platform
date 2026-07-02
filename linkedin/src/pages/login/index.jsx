import UserLayout from "@/layout/UserLayout";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { registerUser, loginUser } from "@/config/redux/action/authAction";
import { emptyMessage } from "@/config/redux/reducer/authReducer";
import { validateLogin, validateRegister } from "@/config/validation";
import styles from "./style.module.css";

function LoginComponent() {
  const authState = useSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();

  const [userLoginMethod, setUserLoginMethod] = useState(false);
  const [email, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (authState.loggedIn) {
      router.push("/dashboard");
    }
  }, [authState.loggedIn, router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && router.pathname === "/login") {
      router.push("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    dispatch(emptyMessage());
    setFieldErrors({});
  }, [userLoginMethod, dispatch]);

  const handleRegister = () => {
    const errors = validateRegister({ name, username, email, password });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    dispatch(registerUser({ username, password, email, name }));
  };

  const handleLogin = () => {
    const errors = validateLogin({ email, password });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    dispatch(loginUser({ email, password }));
  };

  const handleSubmit = () => {
    if (userLoginMethod) handleLogin();
    else handleRegister();
  };

  return (
    <UserLayout>
      <div className={styles.container}>
        <div className={styles.cardContainer}>
          <div className={styles.cardContainer_left}>
            <p className={styles.cardleft_heading}>{userLoginMethod ? "Sign In" : "Sign Up"}</p>
            <p className={`${styles.statusMsg} ${authState.isError ? styles.error : styles.success}`}>
              {typeof authState.message === "string"
                ? authState.message
                : authState.message?.message}
            </p>

            <div className={styles.inputContainer}>
              {!userLoginMethod && (
                <div className={styles.inputRow}>
                  <div className={styles.fieldWrap}>
                    <input
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" });
                      }}
                      className={`${styles.inputField} ${fieldErrors.name ? styles.inputError : ""}`}
                      type="text"
                      placeholder="Name"
                      value={name}
                    />
                    {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
                  </div>
                  <div className={styles.fieldWrap}>
                    <input
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: "" });
                      }}
                      className={`${styles.inputField} ${fieldErrors.username ? styles.inputError : ""}`}
                      type="text"
                      placeholder="Username"
                      value={username}
                    />
                    {fieldErrors.username && <span className={styles.fieldError}>{fieldErrors.username}</span>}
                  </div>
                </div>
              )}
              <div className={styles.fieldWrap}>
                <input
                  onChange={(e) => {
                    setEmailAddress(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                  }}
                  className={`${styles.inputField} ${fieldErrors.email ? styles.inputError : ""}`}
                  type="email"
                  placeholder="Email"
                  value={email}
                />
                {fieldErrors.email && <span className={styles.fieldError}>{fieldErrors.email}</span>}
              </div>
              <div className={styles.fieldWrap}>
                <input
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
                  }}
                  className={`${styles.inputField} ${fieldErrors.password ? styles.inputError : ""}`}
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={password}
                />
                {fieldErrors.password && <span className={styles.fieldError}>{fieldErrors.password}</span>}
              </div>

              <div onClick={handleSubmit} className={styles.buttonWithOutline}>
                <p>{userLoginMethod ? "Sign In" : "Sign Up"}</p>
              </div>
            </div>
          </div>

          <div className={styles.cardContainer_right}>
            <p>{userLoginMethod ? "Don't have an account?" : "Already have an account?"}</p>
            <div
              onClick={() => setUserLoginMethod(!userLoginMethod)}
              style={{ color: "black", textAlign: "center" }}
              className={styles.buttonWithOutline}
            >
              <p>{userLoginMethod ? "Sign Up" : "Sign In"}</p>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

export default LoginComponent;
