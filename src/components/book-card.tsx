"use client";

import { useState } from "react";
import { Download, Plus, Loader2, Search } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReadarrBook } from "@/types/readarr";
import { BookCover } from "@/components/book-cover";
import { toast } from "sonner";

interface BookCardProps {
  book: ReadarrBook;
  inLibrary?: boolean;
  onRequest?: (book: ReadarrBook) => Promise<void>;
  onDownload?: (bookId: number) => void;
  onSearch?: (bookId: number) => void;
}

export function BookCard({ book, inLibrary, onRequest, onDownload, onSearch }: BookCardProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const authorName = book.author?.authorName || book.authorTitle || "Unknown Author";
  const year = book.releaseDate ? new Date(book.releaseDate).getFullYear() : null;
  
  const hasFiles = book.statistics && book.statistics.bookFileCount > 0;

  const handleRequest = async () => {
    if (!onRequest) return;
    
    setIsRequesting(true);
    try {
      await onRequest(book);
      toast.success(`${book.title} has been requested!`);
    } catch (error) {
      toast.error(`Failed to request ${book.title}`);
      console.error(error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDownload = async () => {
    if (!book.id || !onDownload) return;
    
    setIsDownloading(true);
    try {
      onDownload(book.id);
      toast.success(`Downloading ${book.title}...`);
    } catch (error) {
      toast.error(`Failed to download ${book.title}`);
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSearch = async () => {
    if (!book.id || !onSearch) return;
    
    setIsSearching(true);
    try {
      onSearch(book.id);
      toast.success(`Searching for ${book.title}...`);
    } catch (error) {
      toast.error(`Failed to search for ${book.title}`);
      console.error(error);
    } finally {
      setTimeout(() => setIsSearching(false), 2000);
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="aspect-[2/3] relative bg-muted">
        <BookCover book={book} className="w-full h-full object-cover" />
        {inLibrary && (
          <Badge className="absolute top-2 right-2" variant="secondary">
            In Library
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2 mb-1">{book.title}</h3>
        <p className="text-sm text-muted-foreground mb-2">{authorName}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {year && <span>{year}</span>}
          {book.pageCount && (
            <>
              <span>•</span>
              <span>{book.pageCount} pages</span>
            </>
          )}
        </div>
        {book.overview && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
            {book.overview}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {!inLibrary && onRequest && (
          <Button
            className="w-full"
            onClick={handleRequest}
            disabled={isRequesting}
          >
            {isRequesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Requesting...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Request
              </>
            )}
          </Button>
        )}
        {inLibrary && hasFiles && onDownload && (
          <Button
            className="w-full"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download
              </>
            )}
          </Button>
        )}
        {inLibrary && !hasFiles && onSearch && (
          <Button 
            className="w-full" 
            variant="secondary"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        )}
        {inLibrary && !hasFiles && !onSearch && (
          <Button className="w-full" variant="secondary" disabled>
            Missing
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
