'use client';

import { supabase } from '@/lib/supabase/client';

export interface EnqueueEmailParams {
  eventKey: string;
  recipientEmail: string;
  recipientName?: string;
  subject?: string;
  bodyHtml?: string;
  metadata?: Record<string, string>;
}

export async function enqueueEmail(params: EnqueueEmailParams): Promise<void> {
  const { error } = await supabase.from('notification_queue').insert({
    event_key: params.eventKey,
    recipient_email: params.recipientEmail,
    recipient_name: params.recipientName || null,
    subject: params.subject || '',
    body_html: params.bodyHtml || '',
    status: 'PENDING',
    metadata: params.metadata || {},
  });
  if (error) {
    throw new Error(`Failed to queue email: ${error.message}`);
  }
}

export async function triggerMailProcessing(): Promise<void> {
  const { error } = await supabase.functions.invoke('send-mail', { body: {} });
  if (error) {
    throw new Error(`Failed to process email queue: ${error.message}`);
  }
}

export async function enqueueAndProcess(params: EnqueueEmailParams): Promise<void> {
  await enqueueEmail(params);
  await triggerMailProcessing();
}
