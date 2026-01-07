"use client";

import { useState } from "react";
import { ReadarrBook } from "@/types/readarr";
import { getBookCoverSources } from "@/lib/cover-utils";

interface BookCoverProps {
  book: ReadarrBook;
  className?: string;
}

export function BookCover({ book, className }: BookCoverProps) {
  const coverSources = getBookCoverSources(book);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    // Try next source in the chain
    if (currentSourceIndex < coverSources.length - 1) {
      setCurrentSourceIndex((prev) => prev + 1);
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="relative w-full h-full bg-muted">
      {isLoading && currentSourceIndex < coverSources.length - 1 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
      <img
        src={coverSources[currentSourceIndex]}
        alt={book.title}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
}
