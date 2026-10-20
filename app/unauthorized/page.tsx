import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold">لا تملك صلاحية الوصول</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          تم تسجيل هوية الحساب، لكن هذا الحساب غير موجود ضمن قائمة المستخدمين المعتمدين لهذا التطبيق.
        </p>
        <Link href="/login" className="mt-6 inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
          العودة إلى تسجيل الدخول
        </Link>
      </section>
    </main>
  );
}
