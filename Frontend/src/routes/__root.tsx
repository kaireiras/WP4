import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Toaster } from '#/components/ui/shadcn/sonner'
import { HydrationFixScript } from '#/components/ui/hydration-fix'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'
import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'PLMD · Aplikasi Pendeteksi Keramaian',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: '/logo-ugm.svg',
      },
    ],
  }),
  notFoundComponent: () => {
    // Komponen 404 Page Not Found
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground font-sans">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">
          Halaman yang Anda cari tidak ditemukan.
        </p>
        <Link to="/" className="text-primary hover:underline">
          Kembali ke Dashboard
        </Link>
      </div>
    )
  },
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <HydrationFixScript />
      </head>
      <body suppressHydrationWarning>
        {/* Tempat masuk utama aplikasi */}
        {children}
        <Toaster position="top-right" richColors closeButton theme="light" />

        {/* Devtools akan dihilangkan otomatis di production */}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
