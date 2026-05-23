export type ReadingStatus = 'NotStarted' | 'Reading' | 'Finished';

export interface BookSummaryDto {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string;
  seriesName: string | null;
  seriesIndex: number | null;
  readingStatus: ReadingStatus;
  percentage: number;
  lastReadUtc: string | null;
  fileFound: boolean;
}

export interface BookDetailDto extends BookSummaryDto {
  description: string | null;
  genres: string[];
  publisher: string | null;
  publishedDate: string | null;
  isbn: string | null;
  language: string | null;
  importedUtc: string;
}

export interface ImportResultDto {
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

export interface ShelfDto {
  id: string;
  label: string;
  books: BookSummaryDto[];
}

export interface SpineItemDto {
  href: string;
  mediaType: string;
  title: string | null;
}

export interface ReadingProgressDto {
  bookId: string;
  currentCfi: string | null;
  percentage: number;
  status: ReadingStatus;
  lastReadUtc: string | null;
  totalReadingMinutes: number;
}

export interface ExternalBookMetadataDto {
  title: string | null;
  authors: string[];
  publisher: string | null;
  publishedDate: string | null;
  description: string | null;
  isbn: string | null;
  language: string | null;
  genres: string[];
  coverUrl: string | null;
}

export interface ApiError {
  code: string;
  message: string;
}
