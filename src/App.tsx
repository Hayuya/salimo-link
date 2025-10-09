import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/auth';
import { Header } from '@/components/Header';
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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;