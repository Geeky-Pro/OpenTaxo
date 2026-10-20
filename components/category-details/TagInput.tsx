'use client';

import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function TagInput({ tags, onChange, placeholder = 'أضف قيمة...', disabled = false }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        onChange([...tags, newTag]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      e.preventDefault();
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove: number) => {
    if (disabled) return;
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 p-2 border rounded-md bg-[--background-elevated] border-[--border] ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus-within:ring-1 focus-within:ring-[--ring]'}`}>
      {tags.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-[--accent] text-[--accent-foreground] rounded-sm"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            disabled={disabled}
            className="text-[--foreground-muted] hover:text-[--destructive] transition-colors focus:outline-none"
            aria-label={`إزالة ${tag}`}
          >
            <X size={14} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        disabled={disabled}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-[--foreground-muted]"
      />
    </div>
  );
}
