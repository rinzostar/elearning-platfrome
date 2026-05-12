import '../styles/globals.css';
import { AuthProvider } from '../lib/auth';
import Toaster from '../components/Toaster';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <Toaster />
    </AuthProvider>
  );
}
