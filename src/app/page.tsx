"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/book-card";
import { ReadarrBook } from "@/types/readarr";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

export default function DiscoveryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ReadarrBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const handleSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast.error("Failed to search books. Please check your Readarr connection.");
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedSearch) {
      handleSearch(debouncedSearch);
    }
  }, [debouncedSearch, handleSearch]);

  const handleRequest = async (book: ReadarrBook) => {
    try {
      // Send the complete book object as received from search
      // Readarr expects the exact structure from the lookup endpoint
      console.log("Requesting book:", book);

      const response = await fetch("/api/books/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(book),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Add book error:", error);
        throw new Error(error.error || error.details || "Failed to add book");
      }

      // Refresh search to show updated status
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleDownload = (bookId: number) => {
    // Open download in new tab
    window.open(`/api/download/${bookId}`, "_blank");
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Discover Books</h1>
        <p className="text-muted-foreground">
          Search for books to add to your library
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => handleSearch(searchQuery)}
          disabled={isSearching || !searchQuery}
        >
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {isSearching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isSearching && hasSearched && searchResults.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No books found. Try a different search.</p>
        </div>
      )}

      {!isSearching && searchResults.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {searchResults.map((book) => {
            const inLibrary = book.id !== undefined && book.id > 0;
            return (
              <BookCard
                key={book.titleSlug || book.title}
                book={book}
                inLibrary={inLibrary}
                onRequest={inLibrary ? undefined : handleRequest}
                onDownload={inLibrary ? handleDownload : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
