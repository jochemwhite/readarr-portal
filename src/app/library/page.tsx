"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, Download, CheckCircle2, Clock, ChevronRight, User, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookCard } from "@/components/book-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ReadarrBook } from "@/types/readarr";
import { toast } from "sonner";

type FilterType = "all" | "downloaded" | "missing";
type ViewMode = "books" | "authors";

interface AuthorGroup {
  authorId: number;
  authorName: string;
  books: ReadarrBook[];
  downloadedCount: number;
  totalCount: number;
}

export default function LibraryPage() {
  const [books, setBooks] = useState<ReadarrBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("authors");
  const [expandedAuthors, setExpandedAuthors] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/books");
      
      if (!response.ok) {
        throw new Error("Failed to fetch library");
      }

      const data = await response.json();
      console.log("Fetched books from library:", data.length, "books");
      console.log("Sample book data:", data[0]);
      setBooks(data);
    } catch (error) {
      toast.error("Failed to load library. Please check your Readarr connection.");
      console.error("Library fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (bookId: number) => {
    window.open(`/api/download/${bookId}`, "_blank");
  };

  const filteredBooks = books.filter((book) => {
    const hasFiles = book.statistics && book.statistics.bookFileCount > 0;
    
    switch (filter) {
      case "downloaded":
        return hasFiles;
      case "missing":
        return !hasFiles;
      default:
        return true;
    }
  });

  const stats = {
    total: books.length,
    downloaded: books.filter((b) => b.statistics && b.statistics.bookFileCount > 0).length,
    missing: books.filter((b) => !b.statistics || b.statistics.bookFileCount === 0).length,
  };

  const downloadedPercentage = stats.total > 0 ? (stats.downloaded / stats.total) * 100 : 0;

  // Group books by author
  const authorGroups = useMemo(() => {
    const groups = new Map<number, AuthorGroup>();

    // Helper function to escape regex special characters
    const escapeRegex = (str: string) => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    books.forEach((book) => {
      // Use authorId if available, otherwise use authorTitle as a fallback
      const authorId = book.author?.id || book.authorId || 0;
      
      // Parse author name from authorTitle by removing book title
      let authorName = book.author?.authorName;
      if (!authorName && book.authorTitle) {
        // Remove book title from authorTitle (format: "lastname, firstname BookTitle")
        try {
          const escapedTitle = escapeRegex(book.title);
          authorName = book.authorTitle.replace(new RegExp(` ${escapedTitle}$`, 'i'), '').trim();
        } catch (e) {
          // If regex fails, just use the authorTitle as is
          authorName = book.authorTitle.trim();
        }
        
        // Convert "lastname, firstname" to "Firstname Lastname"
        const nameParts = authorName.split(',').map((p: string) => p.trim());
        if (nameParts.length === 2) {
          authorName = `${nameParts[1]} ${nameParts[0]}`;
        }
        // Capitalize properly
        authorName = authorName.replace(/\b\w/g, (l: string) => l.toUpperCase());
      }
      
      if (!authorName) {
        authorName = book.authorId ? `Author ID: ${book.authorId}` : "Unknown Author";
      }

      if (!groups.has(authorId)) {
        groups.set(authorId, {
          authorId,
          authorName,
          books: [],
          downloadedCount: 0,
          totalCount: 0,
        });
      }

      const group = groups.get(authorId)!;
      group.books.push(book);
      group.totalCount++;
      if (book.statistics && book.statistics.bookFileCount > 0) {
        group.downloadedCount++;
      }
    });

    // Convert to array and sort by author name
    // Put "Unknown Author" at the end
    return Array.from(groups.values()).sort((a, b) => {
      if (a.authorId === 0) return 1;
      if (b.authorId === 0) return -1;
      return a.authorName.localeCompare(b.authorName);
    });
  }, [books]);

  // Filter author groups
  const filteredAuthorGroups = useMemo(() => {
    return authorGroups
      .map((group) => {
        let filteredBooks = group.books;
        
        if (filter === "downloaded") {
          filteredBooks = group.books.filter((b) => b.statistics && b.statistics.bookFileCount > 0);
        } else if (filter === "missing") {
          filteredBooks = group.books.filter((b) => !b.statistics || b.statistics.bookFileCount === 0);
        }

        return {
          ...group,
          books: filteredBooks,
        };
      })
      .filter((group) => group.books.length > 0);
  }, [authorGroups, filter]);

  const toggleAuthor = (authorId: number) => {
    setExpandedAuthors((prev) => {
      const next = new Set(prev);
      if (next.has(authorId)) {
        next.delete(authorId);
      } else {
        next.add(authorId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedAuthors(new Set(authorGroups.map((g) => g.authorId)));
  };

  const collapseAll = () => {
    setExpandedAuthors(new Set());
  };

  const handleSearchAuthor = async (authorGroup: AuthorGroup) => {
    const missingBooks = authorGroup.books.filter(
      (b) => !b.statistics || b.statistics.bookFileCount === 0
    );

    if (missingBooks.length === 0) {
      toast.info(`No missing books for ${authorGroup.authorName}`);
      return;
    }

    try {
      const bookIds = missingBooks.map((b) => b.id).filter((id) => id !== undefined);
      
      const response = await fetch("/api/command/search-books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to trigger search");
      }

      toast.success(`Searching for ${missingBooks.length} missing book(s) by ${authorGroup.authorName}`);
    } catch (error) {
      toast.error("Failed to trigger book search");
      console.error("Search error:", error);
    }
  };

  const handleSearchBook = async (bookId: number) => {
    try {
      const response = await fetch("/api/command/search-books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookIds: [bookId] }),
      });

      if (!response.ok) {
        throw new Error("Failed to trigger search");
      }
    } catch (error) {
      console.error("Search error:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Library</h1>
          <p className="text-muted-foreground">
            Manage your book collection
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Books</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Downloaded</p>
                <p className="text-3xl font-bold">{stats.downloaded}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Missing</p>
                <p className="text-3xl font-bold">{stats.missing}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Library Progress</span>
              <span className="font-medium">{downloadedPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={downloadedPercentage} className="h-2" />
          </div>
        </div>
      </div>

      {/* View Mode Toggle and Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList>
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-2">
                {stats.total}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="downloaded">
              Downloaded
              <Badge variant="secondary" className="ml-2">
                {stats.downloaded}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="missing">
              Missing
              <Badge variant="secondary" className="ml-2">
                {stats.missing}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="authors">By Author</TabsTrigger>
              <TabsTrigger value="books">All Books</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {filter === "all" && "Your library is empty. Start by searching for books!"}
              {filter === "downloaded" && "No downloaded books yet."}
              {filter === "missing" && "All books have been downloaded!"}
            </p>
          </div>
        )}

        {/* Authors View */}
        {!isLoading && viewMode === "authors" && filteredAuthorGroups.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredAuthorGroups.length} author{filteredAuthorGroups.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={expandAll}>
                  Expand All
                </Button>
                <Button variant="ghost" size="sm" onClick={collapseAll}>
                  Collapse All
                </Button>
              </div>
            </div>

            {filteredAuthorGroups.map((group) => (
              <Collapsible
                key={group.authorId}
                open={expandedAuthors.has(group.authorId)}
                onOpenChange={() => toggleAuthor(group.authorId)}
              >
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-4 flex-1 text-left">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{group.authorName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {group.downloadedCount} / {group.totalCount} books downloaded
                          </p>
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-4">
                      {group.downloadedCount < group.totalCount && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSearchAuthor(group);
                          }}
                          className="gap-2"
                        >
                          <Search className="h-4 w-4" />
                          Search All
                        </Button>
                      )}
                      <Badge variant="secondary">
                        {group.books.length} book{group.books.length !== 1 ? "s" : ""}
                      </Badge>
                      <CollapsibleTrigger asChild>
                        <button className="p-1">
                          <ChevronRight
                            className={`h-5 w-5 transition-transform ${
                              expandedAuthors.has(group.authorId) ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                      </CollapsibleTrigger>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="p-6 pt-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {group.books.map((book) => {
                        const hasFiles = book.statistics && book.statistics.bookFileCount > 0;
                        return (
                          <BookCard
                            key={book.id}
                            book={book}
                            inLibrary={true}
                            onDownload={hasFiles ? handleDownload : undefined}
                            onSearch={!hasFiles ? handleSearchBook : undefined}
                          />
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}

        {/* Books View */}
        {!isLoading && viewMode === "books" && filteredBooks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredBooks.map((book) => {
              const hasFiles = book.statistics && book.statistics.bookFileCount > 0;
              return (
                <BookCard
                  key={book.id}
                  book={book}
                  inLibrary={true}
                  onDownload={hasFiles ? handleDownload : undefined}
                  onSearch={!hasFiles ? handleSearchBook : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
