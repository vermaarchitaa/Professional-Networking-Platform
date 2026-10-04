import React from "react";
import { useI18n } from "@/i18n";
import styles from "./styles.module.css";

const FOOTER_COLUMNS = [
  ["footerAbout", "footerAccessibility", "footerTalentSolutions", "footerCommunityGuidelines"],
  ["footerCareers", "footerMarketingSolutions", "footerAdvertising", "footerSmallBusiness"],
  ["footerQuestions", "footerMobile", "footerRecommendation", "footerSafetyCenter"],
  ["footerHelpCenter", "footerPrivacyTerms", "footerAdChoices", "footerFeedback"],
];

export default function Footer() {
  const { t, language, setLanguage, languages } = useI18n();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <p className={styles.logo}>Pro Connect</p>
            <p className={styles.copyright}>{t("footerCopyright")}</p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column[0]} className={styles.column}>
              {column.map((key) => (
                <span key={key} className={styles.item}>{t(key)}</span>
              ))}
            </div>
          ))}
        </div>
        <div className={styles.bottom}>
          <div className={styles.meta}>
            <span className={styles.item}>{t("footerManageAccount")}</span>
            <span className={styles.item}>{t("footerBusinessServices")}</span>
          </div>
          <label className={styles.language}>
            {t("selectLanguage")}
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              aria-label={t("selectLanguage")}
            >
              {languages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </footer>
  );
}
