import { AppRoutes } from './routes/AppRoutes';
import { NotificationsProvider } from './providers/NotificationsProvider';
import { SessionProvider } from './providers/SessionProvider';

export function App() {
  return (
    <NotificationsProvider>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </NotificationsProvider>
  );
}

export default App;
