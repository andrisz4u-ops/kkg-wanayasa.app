/** SHA-256 of a deterministic representation of the persisted title and payload. */
export async function hashDraftContent(title: string, payloadJson: string): Promise<string> {
  const parsedPayload = JSON.parse(payloadJson);
  const canonicalContent = JSON.stringify({
    payload: sortJsonKeys(parsedPayload),
    title,
  });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalContent));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function sortJsonKeys(value: any): any {
  if (Array.isArray(value)) return value.map(sortJsonKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortJsonKeys(value[key])]));
  }
  return value;
}
