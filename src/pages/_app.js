import "@/styles/globals.css";
import { Toaster } from 'sonner';
import 'animate.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Toaster
        richColors
        position="top-right"
      />

      <Component {...pageProps} />
    </>
  );
}

