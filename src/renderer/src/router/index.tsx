import Home from '@renderer/pages/home'
import SettingsLayout from '@renderer/layouts/SettingsLayout'
import { createHashRouter } from 'react-router'
import Settings from '@renderer/pages/settings'
import About from '@renderer/pages/about'

const router = createHashRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/windows/settings',
    element: <SettingsLayout />,
    children: [
      {
        index: true,
        element: <Settings />
      },
      {
        path: 'about',
        element: <About />
      }
    ]
  }
])

export default router
