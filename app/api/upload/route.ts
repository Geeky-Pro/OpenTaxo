import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/require-owner';

export const runtime = 'nodejs';

const imageTypes = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
} as const;

export async function POST(req: NextRequest) {
  try {
    const { supabase } = await requireOwner();
    const formData = await req.formData();
    const file = formData.get('image');
    const slug = formData.get('slug');

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على صورة' },
        { status: 400 },
      );
    }

    if (!(file.type in imageTypes)) {
      return NextResponse.json(
        { success: false, error: 'نوع الملف غير مدعوم. استخدم PNG أو JPG أو WebP.' },
        { status: 400 },
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'حجم الملف يتجاوز 5 ميجابايت' },
        { status: 400 },
      );
    }

    const extension = imageTypes[file.type as keyof typeof imageTypes];
    const baseName = typeof slug === 'string' && slug.trim() ? slug : 'category';
    const safeBase = baseName.replace(/[^a-z0-9-]/gi, '-').toLowerCase().slice(0, 80);
    const fileName = `${safeBase || 'category'}-${crypto.randomUUID()}.${extension}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('categories')
      .upload(fileName, bytes, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      console.error('Category image upload failed:', uploadError.message);
      return NextResponse.json(
        { success: false, error: 'تعذر حفظ الصورة. حاول مرة أخرى.' },
        { status: 500 },
      );
    }

    const { data } = supabase.storage.from('categories').getPublicUrl(fileName);
    return NextResponse.json({ success: true, url: data.publicUrl });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.message.includes('redirect'))) {
      throw error;
    }
    console.error('Category image upload error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء رفع الصورة' },
      { status: 500 },
    );
  }
}
