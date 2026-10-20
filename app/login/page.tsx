'use client';

import { useActionState } from 'react';
import { loginAction } from '@/lib/auth/actions';
import type { LoginState } from '@/lib/auth/types';

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="text-xl font-bold">Y</span>
          </div>
          <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
          <p className="mt-2 text-sm text-muted-foreground">الوصول مخصص للحساب المعتمد فقط.</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              dir="ltr"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-left outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">كلمة المرور</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              dir="ltr"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-left outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {state.error ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'جارٍ التحقق…' : 'دخول'}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          لا يوجد تسجيل عام. يجب اعتماد الحساب من مسؤول المشروع.
        </p>
      </section>
    </main>
  );
}
