import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const BLOG_HOSTS = new Set(['blog.vurenn.com', 'www.blog.vurenn.com'])

export function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0].toLowerCase()

  if (host && BLOG_HOSTS.has(host) && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/blog'
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.png|apple-icon.png).*)'],
}
