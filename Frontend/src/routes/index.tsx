import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('auth_status')
      if (auth === 'loged in') {
        throw redirect({
          to: '/dashboard',
        })
      }
      throw redirect({
        to: '/login',
      })
    }
    throw redirect({
      to: '/dashboard',
    })
  },
})
