import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";
import UserLayout from "@/layout/UserLayout";
import { useI18n } from "@/i18n";
import styles from "@/styles/Home.module.css";

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();
  const [heroFailed, setHeroFailed] = useState(false);

  return (
    <UserLayout>
      <Head>
        <title>Pro Connect</title>
      </Head>

      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.copy}>
            <h1 className={styles.headline}>
              <span className={styles.line1}>{t("connectFriendsLine1")}</span>
              <span className={styles.line2}>{t("connectFriendsLine2")}</span>
            </h1>
            <p className={styles.subtitle}>{t("trueSocial")}</p>
            <button
              type="button"
              className={styles.cta}
              onClick={() => router.push("/login")}
            >
              {t("joinNow")}
            </button>
          </div>

          <div className={styles.visual}>
            {!heroFailed ? (
              <img
                className={styles.heroImage}
                src="/images/connections.webp"
                alt="People connecting on Pro Connect"
                onError={() => setHeroFailed(true)}
              />
            ) : (
              <div className={styles.heroFallback} aria-hidden="true">
                <NetworkArt />
              </div>
            )}
          </div>
        </section>
      </div>
    </UserLayout>
  );
}

function NetworkArt() {
  return (
    <svg viewBox="0 0 640 500" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <rect x="24" y="28" width="592" height="444" rx="36" fill="#F4F1EA" />
      <circle cx="198" cy="248" r="132" fill="#E8EAFF" />
      <circle cx="430" cy="198" r="98" fill="#F7EFE8" />
      <circle cx="468" cy="338" r="62" fill="#ECE7FF" />
      <path d="M188 250c58-78 188-108 292-48" stroke="#3D3AE8" strokeWidth="2.4" strokeDasharray="7 10" opacity="0.42" />
      <path d="M214 286c46 54 154 68 268 12" stroke="#C45C4A" strokeWidth="2.2" strokeDasharray="6 10" opacity="0.38" />
      <path d="M250 168c38-18 86-8 118 24" stroke="#3D3AE8" strokeWidth="2" opacity="0.22" />
      <circle cx="186" cy="252" r="34" fill="#3D3AE8" />
      <circle cx="186" cy="244" r="12" fill="#F8F6F2" />
      <path d="M166 274c10-12 30-12 40 0" stroke="#F8F6F2" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="448" cy="196" r="28" fill="#C45C4A" />
      <circle cx="448" cy="190" r="10" fill="#F8F6F2" />
      <path d="M432 214c8-9 24-9 32 0" stroke="#F8F6F2" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="338" cy="336" r="24" fill="#1F1E2E" />
      <circle cx="338" cy="330" r="8.5" fill="#F8F6F2" />
      <path d="M324 350c7-8 21-8 28 0" stroke="#F8F6F2" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="292" cy="148" r="13" fill="#3D3AE8" opacity="0.88" />
      <circle cx="512" cy="286" r="11" fill="#C45C4A" opacity="0.82" />
      <circle cx="258" cy="372" r="9" fill="#3D3AE8" opacity="0.5" />
    </svg>
  );
}
