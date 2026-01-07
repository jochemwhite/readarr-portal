import { NextRequest, NextResponse } from "next/server";
import {
  addBook,
  getQualityProfiles,
  getRootFolders,
  searchBookCommand,
  searchBooks,
  getBooks,
  ReadarrAPIError,
} from "@/lib/readarr";
import { searchAuthor } from "@/lib/readarr-author";
import { BookAddPayload, ReadarrBook } from "@/types/readarr";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Received book add request:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: "Book title is required" },
        { status: 400 }
      );
    }

    // Construct proper book data for Readarr
    // Readarr's search returns minimal data, so we need to build the structure
    let bookData = body;
    
    // Build author object if missing - must lookup to get foreignAuthorId
    if (!bookData.author && bookData.authorTitle) {
      console.log("Looking up author from authorTitle:", bookData.authorTitle);
      
      // Parse author name (format is usually "lastname, firstname Title")
      let authorName = bookData.authorTitle;
      // Remove book title suffix if present
      authorName = authorName.replace(new RegExp(` ${body.title}$`, 'i'), '');
      // Convert "lastname, firstname" to "Firstname Lastname"
      const nameParts = authorName.split(',').map((p: string) => p.trim());
      if (nameParts.length === 2) {
        authorName = `${nameParts[1]} ${nameParts[0]}`;
      }
      // Capitalize properly
      authorName = authorName.replace(/\b\w/g, (l: string) => l.toUpperCase());
      
      console.log("Searching Readarr for author:", authorName);
      
      try {
        // Search for the author in Readarr to get their foreignAuthorId
        const authorResults = await searchAuthor(authorName);
        
        if (authorResults && authorResults.length > 0) {
          // Use the first matching author
          const matchedAuthor = authorResults[0];
          console.log("Found author in Readarr:", {
            name: matchedAuthor.authorName,
            foreignAuthorId: matchedAuthor.foreignAuthorId,
          });
          
          // Get quality profile for author if not set
          if (!matchedAuthor.qualityProfileId) {
            const profiles = await getQualityProfiles();
            matchedAuthor.qualityProfileId = profiles.length > 0 ? profiles[0].id : 1;
          }
          
          // Get root folder for author path if not set
          if (!matchedAuthor.path) {
            const folders = await getRootFolders();
            const rootFolder = folders.length > 0 ? folders[0].path : "/books";
            matchedAuthor.path = `${rootFolder}/${matchedAuthor.authorName}`;
          }
          
          // Set author to monitor all new books
          matchedAuthor.monitored = true;
          matchedAuthor.monitorNewItems = "all";
          
          bookData.author = matchedAuthor;
        } else {
          console.error("No author found in Readarr for:", authorName);
          return NextResponse.json(
            { error: `Could not find author "${authorName}" in Readarr. Try searching for the author first in Readarr.` },
            { status: 404 }
          );
        }
      } catch (error) {
        console.error("Failed to search for author:", error);
        return NextResponse.json(
          { error: "Failed to lookup author information", details: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    }
    
    // Build editions array if missing
    if (!bookData.editions || bookData.editions.length === 0) {
      console.log("Constructing editions array from book data");
      
      if (!bookData.foreignEditionId) {
        return NextResponse.json(
          { error: "Book must have a foreignEditionId to create an edition" },
          { status: 400 }
        );
      }
      
      bookData.editions = [{
        foreignEditionId: bookData.foreignEditionId,
        titleSlug: bookData.titleSlug,
        isbn13: "", // Will be populated by Readarr
        asin: "",
        title: bookData.title,
        overview: "",
        format: "",
        isEbook: false,
        publisher: "",
        pageCount: bookData.pageCount || 0,
        releaseDate: bookData.releaseDate,
        images: bookData.images || [],
        links: bookData.links || [],
        ratings: bookData.ratings,
        monitored: true,
      }];
      
      console.log("Created editions array with", bookData.editions.length, "edition(s)");
    }

    // Validate we now have required fields
    if (!bookData.author) {
      return NextResponse.json(
        { error: "Book author information is required but could not be constructed" },
        { status: 400 }
      );
    }

    if (!bookData.editions || bookData.editions.length === 0) {
      return NextResponse.json(
        { error: "Book must have at least one edition" },
        { status: 400 }
      );
    }

    // Fetch quality profile and root folder if not provided
    let qualityProfileId = bookData.qualityProfileId;

    if (!qualityProfileId) {
      const profiles = await getQualityProfiles();
      if (profiles.length === 0) {
        return NextResponse.json(
          { error: "No quality profiles found in Readarr" },
          { status: 500 }
        );
      }
      qualityProfileId = profiles[0].id;
    }

    let rootFolderPath = bookData.rootFolderPath;
    if (!rootFolderPath) {
      const folders = await getRootFolders();
      if (folders.length === 0) {
        return NextResponse.json(
          { error: "No root folders found in Readarr" },
          { status: 500 }
        );
      }
      rootFolderPath = folders[0].path;
    }

    // Ensure author is monitored and set to monitor all new books
    if (bookData.author) {
      bookData.author.monitored = true;
      bookData.author.monitorNewItems = "all";
    }

    // Ensure all editions are monitored
    if (bookData.editions) {
      bookData.editions = bookData.editions.map((edition: any) => ({
        ...edition,
        monitored: true,
      }));
    }

    // Build the payload with required Readarr fields using the full book data
    const bookPayload = {
      title: bookData.title,
      titleSlug: bookData.titleSlug,
      author: bookData.author,
      editions: bookData.editions,
      monitored: true,
      anyEditionOk: bookData.anyEditionOk ?? true,
      authorId: bookData.authorId || 0,
      foreignBookId: bookData.foreignBookId,
      qualityProfileId,
      metadataProfileId: bookData.author?.metadataProfileId || 1,
      rootFolderPath,
      addOptions: {
        monitor: "all",
        searchForNewBook: true,
        searchForMissingBook: false,
      },
    };

    console.log("Sending payload to Readarr:", JSON.stringify(bookPayload, null, 2));

    const addedBook = await addBook(bookPayload);

    console.log("Book added successfully:", addedBook.id);

    // Trigger author refresh to sync all their books from metadata sources
    if (addedBook.author?.id || bookData.author?.id) {
      try {
        const authorId = addedBook.author?.id || bookData.author?.id;
        console.log("Triggering author refresh for ID:", authorId);
        
        // Trigger RefreshAuthor command to sync all books
        await fetch(`${process.env.READARR_API_URL}/api/v1/command`, {
          method: "POST",
          headers: {
            "X-Api-Key": process.env.READARR_API_KEY || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "RefreshAuthor",
            authorId: authorId,
          }),
        });
        
        console.log("Author refresh triggered, waiting for sync...");
        
        // Wait a bit for Readarr to sync (adjust timing as needed)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log("Fetching all books by author ID:", authorId);
        
        // Get all books by this author
        const allBooks = await getBooks();
        const authorBooks = allBooks.filter((b: ReadarrBook) => b.author?.id === authorId || b.authorId === authorId);
        
        // Find all missing books (not downloaded)
        const missingBooks = authorBooks.filter(
          (b: ReadarrBook) => !b.statistics || b.statistics.bookFileCount === 0
        );
        
        console.log(`Found ${authorBooks.length} total books, ${missingBooks.length} missing`);
        
        if (missingBooks.length > 0) {
          const bookIds = missingBooks.map((b: ReadarrBook) => b.id).filter((id: number | undefined) => id !== undefined);
          
          // Trigger search for all missing books
          await fetch(`${process.env.READARR_API_URL}/api/v1/command`, {
            method: "POST",
            headers: {
              "X-Api-Key": process.env.READARR_API_KEY || "",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: "BookSearch",
              bookIds: bookIds,
            }),
          });
          
          console.log(`Triggered search for ${bookIds.length} missing books by author`);
        }
      } catch (error) {
        console.error("Failed to search for author's books:", error);
        // Don't fail the request if author book search fails
      }
    }

    return NextResponse.json(addedBook);
  } catch (error) {
    console.error("Error adding book:", error);
    if (error instanceof ReadarrAPIError) {
      return NextResponse.json(
        { error: error.message, status: error.status },
        { status: error.status || 500 }
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
