import { AppRoutes } from './routes/AppRoutes';
import { NotificationsProvider } from './providers/NotificationsProvider';
import { SessionProvider } from './providers/SessionProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { SearchProvider } from './providers/SearchProvider';

export function App() {
  return (
    <NotificationsProvider>
      <ThemeProvider>
        <SessionProvider>
          <SearchProvider>
            <AppRoutes />
          </SearchProvider>
        </SessionProvider>
      </ThemeProvider>
    </NotificationsProvider>
  );
}

export default App;