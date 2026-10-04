import { createClient } from '@supabase/supabase-js';
import { compressImageToWebP } from './imageCompressor';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Returns true if real Supabase environment variables are provided.
 */
export function isSupabaseConfigured() {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-id') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 20 &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
  );
}

/**
 * Supabase client instance initialized with anon public key only.
 * NEVER expose the service_role key here.
 */
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// ==============================================================================
// AUDIT LOGGING & VERSION SNAPSHOT HELPERS
// ==============================================================================

/**
 * Records an entry in public.audit_log
 */
export async function logAuditEvent({ action, entityType, entityId, oldValue = null, newValue = null, userEmail = 'admin' }) {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_log').insert([
      {
        user_id: user?.id || null,
        user_email: user?.email || userEmail,
        action,
        entity_type: entityType,
        entity_id: String(entityId || ''),
        old_value: oldValue,
        new_value: newValue,
      },
    ]);
  } catch (err) {
    console.warn('[Audit Log] Failed to record event:', err.message);
  }
}

/**
 * Saves a version snapshot before updating page content or site settings
 */
export async function saveContentVersion({ page = null, sectionKey = null, settingKey = null, content, changedBy = 'admin' }) {
  if (!supabase || !content) return;
  try {
    await supabase.from('content_versions').insert([
      {
        page,
        section_key: sectionKey,
        setting_key: settingKey,
        content,
        changed_by: changedBy,
      },
    ]);
  } catch (err) {
    console.warn('[Content Version] Snapshot error:', err.message);
  }
}

// ==============================================================================
// PUBLIC FORM SUBMISSIONS (INSERT-ONLY VIA RLS)
// ==============================================================================

/**
 * Submits a contact form message (with honeypot check)
 */
export async function submitContactMessage(payload) {
  if (!supabase) {
    console.log('[Offline Form] Stored message in memory/log:', payload);
    return { data: payload, error: null };
  }
  // Honeypot spam test
  if (payload.honeypot) {
    return { data: null, error: new Error('Submission rejected by spam detection.') };
  }
  return await supabase.from('messages').insert([
    {
      name: payload.name,
      email: payload.email,
      phone: payload.phone || '',
      subject: payload.subject || 'Table Reservation / Inquiry',
      message: payload.message,
      honeypot: '',
      status: 'new',
    },
  ]);
}

/**
 * Submits a table reservation
 */
export async function submitReservation(payload) {
  if (!supabase) {
    console.log('[Offline Form] Stored reservation:', payload);
    return { data: payload, error: null };
  }
  if (payload.honeypot) {
    return { data: null, error: new Error('Submission rejected.') };
  }
  return await supabase.from('reservations').insert([
    {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      guests: parseInt(payload.guests || '2', 10),
      date: payload.date,
      time: payload.time,
      seating_area: payload.seating_area || 'Indoor Dining',
      notes: payload.notes || '',
      honeypot: '',
      status: 'new',
    },
  ]);
}

/**
 * Subscribes an email to the Foodie Club
 */
export async function submitSubscriber(email, honeypot = '') {
  if (honeypot) return { data: null, error: new Error('Rejected.') };
  if (!supabase) return { data: { email }, error: null };

  return await supabase.from('subscribers').upsert(
    [
      {
        email: email.trim().toLowerCase(),
        status: 'active',
        source: 'footer_foodie_club',
        honeypot: '',
      },
    ],
    { onConflict: 'email' }
  );
}

/**
 * Submits an order from Chatbot or Cart Drawer
 */
export async function submitOrder(orderData) {
  if (!supabase) {
    console.log('[Offline Order] Order captured locally:', orderData);
    return { data: orderData, error: null };
  }
  return await supabase.from('orders').insert([
    {
      customer_name: orderData.customerName,
      customer_phone: orderData.customerPhone,
      customer_address: orderData.customerAddress || '',
      order_type: orderData.orderType || 'Pickup',
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      delivery_fee: orderData.deliveryFee || 0,
      total: orderData.total || 0,
      payment_method: orderData.paymentMethod || 'Cash on Pickup',
      special_instructions: orderData.instructions || '',
      source: orderData.source || 'website_chat',
      status: 'new',
    },
  ]);
}

// ==============================================================================
// MEDIA STORAGE & COMPRESSION
// ==============================================================================

/**
 * Compresses an image client-side to WebP, uploads to `site-media` bucket,
 * and records it in public.media
 */
export async function uploadMediaFile(file, altText = '', maxWidth = 1600) {
  if (!supabase) {
    throw new Error('Supabase is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
  }

  // 1. Client-side compression
  const compressed = await compressImageToWebP(file, maxWidth, 0.82);

  // 2. Storage upload to `site-media` bucket
  const filePath = `uploads/${Date.now()}-${compressed.name}`;
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from('site-media')
    .upload(filePath, compressed.blob, {
      contentType: compressed.blob.type,
      cacheControl: '31536000',
      upsert: true,
    });

  if (uploadErr) {
    throw new Error(`Upload failed: ${uploadErr.message}`);
  }

  // 3. Obtain public URL
  const { data: publicUrlData } = supabase.storage
    .from('site-media')
    .getPublicUrl(uploadData.path);

  const publicUrl = publicUrlData.publicUrl;

  // 4. Save metadata in public.media
  const { data: mediaRow, error: mediaErr } = await supabase
    .from('media')
    .insert([
      {
        url: publicUrl,
        path: uploadData.path,
        alt_text: altText || file.name,
        width: compressed.width,
        height: compressed.height,
        size: compressed.size,
      },
    ])
    .select()
    .single();

  if (mediaErr) {
    console.warn('[Media Table] Metadata insert warning:', mediaErr.message);
  }

  await logAuditEvent({
    action: 'UPLOAD_MEDIA',
    entityType: 'media',
    entityId: mediaRow?.id || uploadData.path,
    newValue: { url: publicUrl, path: uploadData.path, size: compressed.size },
  });

  return {
    id: mediaRow?.id,
    url: publicUrl,
    path: uploadData.path,
    altText: altText || file.name,
    size: compressed.size,
  };
}
