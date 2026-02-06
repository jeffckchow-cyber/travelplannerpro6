
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kicskjevzuegrxcektnd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpY3NramV2enVlZ3J4Y2VrdG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMzU1NjgsImV4cCI6MjA4NTkxMTU2OH0.KsEBcE_56vWPMj6-ho-2OGJ3RYCHfrTxOecXK0NPrmc';

// The ID used to identify the single itinerary record shared across devices.
// User confirmed the database 'id' column is now of type TEXT.
const SHARED_STATE_ID = 'global-state-v1';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Uploads a file to Supabase storage.
 */
export const uploadAttachment = async (file: File): Promise<string | null> => {
  console.group(`[Supabase:Upload] ${file.name}`);
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload Error:', uploadError.message);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    console.log('Public URL Generated:', urlData.publicUrl);
    console.groupEnd();
    return urlData.publicUrl;
  } catch (err: any) {
    console.error('Unexpected Storage Error:', err.message);
    console.groupEnd();
    if (err.message?.includes('row-level security')) return 'RLS_ERROR';
    return null;
  }
};

/**
 * Pushes the current application state to the cloud.
 */
export const syncAppState = async (state: any) => {
  console.group('[Supabase:Sync]');
  try {
    console.log('Attempting Upsert for ID:', SHARED_STATE_ID);
    const { data, error } = await supabase
      .from('itineraries')
      .upsert({ 
        id: SHARED_STATE_ID, 
        data: state,
        updated_at: new Date().toISOString() 
      }, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Database Sync Failed:', error.message);
      console.error('Error Hint:', error.hint);
      throw error;
    }

    console.log('Cloud Sync Success:', data);
    console.groupEnd();
  } catch (err) {
    console.groupEnd();
    throw err;
  }
};

/**
 * Pulls the latest application state from the cloud.
 */
export const fetchAppState = async () => {
  console.group('[Supabase:Fetch]');
  try {
    console.log('Querying ID:', SHARED_STATE_ID);
    const { data, error } = await supabase
      .from('itineraries')
      .select('data, updated_at')
      .eq('id', SHARED_STATE_ID)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No cloud record found. This is normal for new accounts.');
      } else {
        console.error('Fetch Failed:', error.message);
      }
      console.groupEnd();
      return null;
    }
    
    console.log(`Cloud data retrieved. Last Updated: ${data.updated_at}`);
    console.groupEnd();
    return data?.data;
  } catch (err) {
    console.error('Unexpected Retrieval Error:', err);
    console.groupEnd();
    return null;
  }
};
