import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function deleteStorageFolder(supabaseAdmin: any, bucket: string, folderPath: string) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).list(folderPath);

  if (error) {
    console.error(`Error listing files in ${bucket}/${folderPath}:`, error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log(`No files found in ${bucket}/${folderPath}. Nothing to delete.`);
    return;
  }

  const filePaths = data.map((file) => `${folderPath}/${file.name}`);
  const { error: deleteError } = await supabaseAdmin.storage.from(bucket).remove(filePaths);

  if (deleteError) {
    console.error(`Error deleting files from ${bucket}/${folderPath}:`, deleteError.message);
    // Optionally, you could throw the error to be handled by the caller
    // throw deleteError;
  } else {
    console.log(`Successfully deleted all files from ${bucket}/${folderPath}.`);
  }
}
