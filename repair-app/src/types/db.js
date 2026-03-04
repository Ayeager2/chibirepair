// src/types/db.js

// This import is ONLY for editor type info (no runtime use).
 
import Database from "./supabase";

/**
 * @typedef {import("./supabase").Database} Database
 * @typedef {Database["public"]["Tables"]} Tables
 * @typedef {Tables["products"]["Row"]} ProductRow
 * @typedef {Tables["products"]["Insert"]} ProductInsert
 * @typedef {Tables["products"]["Update"]} ProductUpdate
 */
export {};