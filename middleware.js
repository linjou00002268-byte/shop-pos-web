// middleware.js  (ຢູ່ ROOT ຂອງໂປຣເຈັກ — ລະດັບດຽວກັນກັບ package.json, ບໍ່ແມ່ນໃນ app/)
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isApi = request.nextUrl.pathname.startsWith('/api');
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!user && !isLoginPage) {
    if (isApi) {
      return NextResponse.json({ error: 'ຕ້ອງເຂົ້າສູ່ລະບົບກ່ອນ' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
