import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { router } from '@/routes'
import './index.css'

/**
 * Application entry point.
 *
 * ThemeProvider sits outside the router so the theme applies to every route,
 * including the admin area, and survives navigation.
 */
const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element #root is missing from index.html')
}

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
      {/* richColors gives success and error toasts distinct palettes rather
          than relying on an icon alone to carry the meaning. */}
      <Toaster position="bottom-right" richColors closeButton />
    </ThemeProvider>
  </StrictMode>
)
