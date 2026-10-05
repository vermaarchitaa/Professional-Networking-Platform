import { Plus_Jakarta_Sans } from "next/font/google";
import { store } from "@/config/redux/store";
import { LanguageProvider } from "@/i18n";
import "@/styles/globals.css";
import { Provider } from "react-redux";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export default function App({ Component, pageProps }) {
  return (
    <div className={plusJakarta.variable}>
      <Provider store={store}>
        <LanguageProvider>
          <Component {...pageProps} />
        </LanguageProvider>
      </Provider>
    </div>
  );
}
