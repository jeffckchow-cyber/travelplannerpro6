
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kicskjevzuegrxcektnd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpY3NramV2enVlZ3J4Y2VrdG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMzU1NjgsImV4cCI6MjA4NTkxMTU2OH0.KsEBcE_56vWPMj6-ho-2OGJ3RYCHfrTxOecXK0NPrmc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const uploadAttachment = async (file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `public/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    return null;
  }

  const { data } = supabase.storage
    .from('attachments')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const syncAppState = async (state: any) => {
  // We use a single record for the trial app state, using a static ID
  const { error } = await supabase
    .from('itineraries')
    .upsert({ 
      id: 'global-state-v1', 
      trip_data: state,
      updated_at: new Date().toISOString() 
    }, { onConflict: 'id' });

  if (error) console.error('Supabase Sync Error:', error);
};

export const fetchAppState = async () => {
  const { data, error } = await supabase
    .from('itineraries')
    .select('trip_data')
    .eq('id', 'global-state-v1')
    .single();

  if (error) {
    console.warn('Supabase Fetch Error (expected if empty):', error);
    return null;
  }
  return data?.trip_data;
};
