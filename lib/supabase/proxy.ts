import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/database.types';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return new NextResponse('Supabase environment is not configured.', { status: 503 });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [name, value] of Object.entries(headers)) {
          response.headers.set(name, value);
        }
      },
    },
  });

  // Verify the session before using its identity for authorization.
  const { data: { user }, error } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isLogin = pathname === '/login';
  const isUnauthorized = pathname === '/unauthorized';
  const isApi = pathname.startsWith('/api/');

  if (error || !user) {
    if (isLogin || isUnauthorized) return response;
    if (isApi) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  const { data: authorization, error: authorizationError } = await supabase
    .from('app_authorized_users')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (authorizationError || !authorization) {
    if (isUnauthorized) return response;
    if (isApi) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const unauthorizedUrl = request.nextUrl.clone();
    unauthorizedUrl.pathname = '/unauthorized';
    unauthorizedUrl.search = '';
    return NextResponse.redirect(unauthorizedUrl);
  }

  if (isLogin || isUnauthorized) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    homeUrl.search = '';
    return NextResponse.redirect(homeUrl);
  }

  return response;
}
