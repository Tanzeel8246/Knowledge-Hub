export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  titleArabic?: string;
  content: string;
  contentArabic?: string;
}

export interface Book {
  id: string;
  title: string;
  titleArabic?: string;
  author: string;
  authorArabic?: string;
  category: string;
  language: "ur" | "ar" | "en";
  description: string;
  totalChapters: number;
  publishedYear?: number;
  chapters: Chapter[];
}

export interface BookCategory {
  id: string;
  name: string;
  nameArabic?: string;
}
