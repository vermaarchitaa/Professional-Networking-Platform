import UserLayout from "@/layout/UserLayout";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { registerUser, loginUser } from "@/config/redux/action/authAction";
import { emptyMessage } from "@/config/redux/reducer/authReducer";
import { validateLogin, validateRegister } from "@/config/validation";
import { tMessage, useI18n } from "@/i18n";
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
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useI18n();

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
    setShowPassword(false);
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
            <p className={styles.cardleft_heading}>{userLoginMethod ? t("signIn") : t("signUp")}</p>
            <p className={`${styles.statusMsg} ${authState.isError ? styles.error : styles.success}`}>
              {tMessage(t, typeof authState.message === "string"
                ? authState.message
                : authState.message?.message)}
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
                      placeholder={t("name")}
                      value={name}
                    />
                    {fieldErrors.name && <span className={styles.fieldError}>{t(fieldErrors.name)}</span>}
                  </div>
                  <div className={styles.fieldWrap}>
                    <input
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: "" });
                      }}
                      className={`${styles.inputField} ${fieldErrors.username ? styles.inputError : ""}`}
                      type="text"
                      placeholder={t("username")}
                      value={username}
                    />
                    {fieldErrors.username && <span className={styles.fieldError}>{t(fieldErrors.username)}</span>}
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
                  placeholder={t("email")}
                  value={email}
                />
                {fieldErrors.email && <span className={styles.fieldError}>{t(fieldErrors.email)}</span>}
              </div>
              <div className={styles.fieldWrap}>
                <div className={styles.passwordWrapper}>
                  <input
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
                    }}
                    className={`${styles.inputField} ${fieldErrors.password ? styles.inputError : ""}`}
                    type={showPassword ? "text" : "password"}
                    placeholder={t("password")}
                    value={password}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {fieldErrors.password && <span className={styles.fieldError}>{t(fieldErrors.password)}</span>}
              </div>

              <div onClick={handleSubmit} className={styles.buttonWithOutline}>
                <p>{userLoginMethod ? t("signIn") : t("signUp")}</p>
              </div>
            </div>
          </div>

          <div className={styles.cardContainer_right}>
            <p>{userLoginMethod ? t("dontHaveAccount") : t("alreadyHaveAccount")}</p>
            <div
              onClick={() => setUserLoginMethod(!userLoginMethod)}
              style={{ color: "black", textAlign: "center" }}
              className={styles.buttonWithOutline}
            >
              <p>{userLoginMethod ? t("signUp") : t("signIn")}</p>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

export default LoginComponent;
