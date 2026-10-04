import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useRouter } from "next/router";
import UserLayout from "@/layout/UserLayout";
import { useI18n } from "@/i18n";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {

  const router = useRouter();
  const { t } = useI18n();

  return (
    <UserLayout>
       
      <div className={styles.container}>

        <div className={styles.mainContainer}>

          <div className={styles.mainContainer_left}>

            <p>{t("connectFriends")}</p>
 
            <p>{t("trueSocial")}</p>

            <div onClick ={() => {
              router.push("/login");
            }} className={styles.buttonJoin}>
              <p>{t("joinNow")}</p>
            </div>

          </div>

          <div className={styles.mainContainer_right}>
            <img src="images/connections.webp" alt="" />
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
