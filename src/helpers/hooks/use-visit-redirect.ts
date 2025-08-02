'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useVisitRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const [shouldRender, setShouldRender] = useState<boolean>(false)

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited')
    console.log('useVisitRedirect: Current URL:', { pathname, search: searchParams.toString() })

    if (!hasVisited) {
      console.log('First visit, rendering:', pathname)
      localStorage.setItem('hasVisited', 'true')
      setShouldRender(true)
    } else if (pathname === `/${locale}` || pathname === '/') {
      console.log('Repeat visit on root, redirecting to /selling-classifieds with params:', searchParams.toString())
      const queryString = searchParams.toString()
      const redirectUrl = queryString
        ? `/${locale}/selling-classifieds?${queryString}`
        : `/${locale}/selling-classifieds`
      router.replace(redirectUrl)
    } else {
      console.log('Repeat visit, rendering:', pathname, 'params:', searchParams.toString())
      setShouldRender(true)
    }
  }, [router, pathname, locale, searchParams])

  return shouldRender
}