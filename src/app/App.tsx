// Root component of the application. It mounts the React Router data router
// (defined in routes.tsx), which in turn wires up authentication, route guards,
// and every page. All app-wide configuration lives in routes.tsx, so this file
// stays intentionally thin.
import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function App() {
  return <RouterProvider router={router} />;
}