
import { supabase } from "../supabaseClient";

/**
 * Small wrapper for consistent error handling
 * Always throws on error so callers can handle it once
 */
export async function db(queryFn){
    const res = await queryFn(supabase);
    if(res?.error) throw new Error(res.error.message);
    return res;
}