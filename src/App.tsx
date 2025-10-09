// src/App.tsx
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/auth';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AppRoutes } from '@/routes/AppRoutes';
import './global.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <main>
          <AppRoutes />
        </main>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;