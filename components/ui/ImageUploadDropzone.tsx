'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageUploadDropzoneProps {
  value: string | null;
  onChange: (url: string | null) => void;
  slug?: string;
  className?: string;
}

export function ImageUploadDropzone({ value, onChange, slug, className }: ImageUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (slug) formData.append('slug', slug);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        onChange(data.url);
      } else {
        setError(data.error || 'فشل الرفع');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png, image/jpeg, image/webp, image/svg+xml"
        onChange={handleFileChange}
      />
      
      {value ? (
        <div className="relative w-full h-32 rounded-lg border overflow-hidden group bg-muted/30">
          <Image
            src={value}
            alt="صورة التصنيف"
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 100vw, 200px"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-background/95 p-2 border-t">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              تغيير الصورة
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                onChange(null);
              }}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              إزالة الصورة
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors px-4 text-center",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            error ? "border-destructive/50 bg-destructive/5" : ""
          )}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          ) : (
            <>
              <div className="p-2 bg-secondary rounded-full">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">انقر أو اسحب الصورة هنا</span>
                <span className="text-xs text-muted-foreground">PNG, JPG, WebP (Max: 5MB)</span>
              </div>
            </>
          )}
        </div>
      )}
      
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
