import { createBrowserRouter } from 'react-router-dom';

import HomePage from './pages/HomePage.jsx';
import LabPage from './pages/LabPage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/lab',
    element: <LabPage />,
  },
  {
    path: '*',
    element: <HomePage />,
  },
]);