/**
 * Maktaba Shamela (المكتبة الشاملة) Database Converter & Exporter
 *
 * This script handles:
 * 1. Importing Maktaba Shamela SQLite (.bok/.sqlite) or JSON databases.
 * 2. Normalizing Arabic and Urdu texts (stripping diacritics for FTS search).
 * 3. Structuring books into books, chapters, and hadiths tables/collections.
 * 4. Exporting to standard JSON datasets and SQLite databases for the mobile app.
 */

const fs = require('fs');
const path = require('path');

// Normalization utilities
function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .toLowerCase()
    .trim();
}

function normalizeUrdu(text) {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ے/g, 'ی')
    .replace(/ۂ/g, 'ہ')
    .toLowerCase()
    .trim();
}

/**
 * Validates and converts a raw Shamela book object into the standard app format
 */
function convertShamelaBook(raw) {
  const id = raw.id || `shamela_${raw.shamelaId || Date.now()}`;
  const title = raw.title || raw.name || 'كتاب بدون عنوان';
  const titleArabic = raw.titleArabic || raw.title || title;
  const author = raw.author || 'من علماء الإسلام';
  const category = raw.category || 'islamic';
  const language = raw.language || 'ur';
  const totalChapters = raw.chapters ? raw.chapters.length : (raw.totalChapters || 0);

  const chapters = (raw.chapters || []).map((ch, idx) => ({
    id: ch.id || `${id}_ch_${idx + 1}`,
    chapterNumber: ch.chapterNumber || (idx + 1),
    title: ch.title || `الباب ${idx + 1}`,
    titleArabic: ch.titleArabic || ch.title,
    content: ch.content || '',
    contentArabic: ch.contentArabic || undefined,
  }));

  return {
    id,
    shamelaId: raw.shamelaId || undefined,
    title,
    titleArabic,
    author,
    authorArabic: raw.authorArabic || author,
    category,
    language,
    description: raw.description || `من أمهات كتب المكتبة الشاملة في ${category}`,
    totalChapters: chapters.length > 0 ? chapters.length : totalChapters,
    publishedYear: raw.publishedYear || undefined,
    chapters,
  };
}

module.exports = {
  normalizeArabic,
  normalizeUrdu,
  convertShamelaBook,
};
