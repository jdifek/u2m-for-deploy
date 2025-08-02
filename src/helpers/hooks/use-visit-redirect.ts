'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function useVisitRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const [shouldRender, setShouldRender] = useState<boolean>(false)

  // 👇 Добавляем флаг, чтобы избежать повторного редиректа
  const hasRedirected = useRef(false)

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited')
    const isRootPath = pathname === `/${locale}` || pathname === '/'

    console.log('useVisitRedirect: Current URL:', { pathname, search: searchParams.toString() })

    if (!hasVisited) {
      console.log('First visit, rendering:', pathname)
      localStorage.setItem('hasVisited', 'true')
      setShouldRender(true)
      return
    }

    if (isRootPath && !hasRedirected.current) {
      console.log('Repeat visit on root, redirecting to /selling-classifieds')
      const queryString = searchParams.toString()
      const redirectUrl = queryString
        ? `/${locale}/selling-classifieds?${queryString}`
        : `/${locale}/selling-classifieds`
      hasRedirected.current = true // 👈 предотвращаем повтор
      router.replace(redirectUrl)
      return // ❗ НЕ вызываем setShouldRender здесь, потому что сразу редиректим
    }

    // Если мы не на руте — можно рендерить
    setShouldRender(true)
  }, [pathname, locale, searchParams, router])

  return shouldRender
}
