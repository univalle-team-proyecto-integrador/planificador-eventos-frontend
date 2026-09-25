import { AppRoutes } from './routes/AppRoutes';
import { NotificationsProvider } from './providers/NotificationsProvider';

export function App() {
  return (
    <NotificationsProvider>
      <AppRoutes />
    </NotificationsProvider>
  );
}

export default App;
