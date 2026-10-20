'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

import type { LoginState } from '@/lib/auth/types';

export async function loginAction(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'أدخل البريد الإلكتروني وكلمة المرور.' };
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return { error: 'إعدادات الاتصال غير مكتملة. راجع متغيرات البيئة.' };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: 'تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    await supabase.auth.signOut();
    return { error: 'تعذر التحقق من الحساب.' };
  }

  const { data: authorization, error: authorizationError } = await supabase
    .from('app_authorized_users')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (authorizationError || !authorization) {
    await supabase.auth.signOut();
    redirect('/unauthorized');
  }

  redirect('/');
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
