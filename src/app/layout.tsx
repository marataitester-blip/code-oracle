// pages/_app.js

import '../styles/globals.css';
import BottomNavigation from '../components/BottomNavigation';

function MyApp({ Component, pageProps }) {
  return (
    <div className="appContainer">
      <main className="content">
        <Component {...pageProps} />
      </main>
      <BottomNavigation />
    </div>
  );
}

export default MyApp;