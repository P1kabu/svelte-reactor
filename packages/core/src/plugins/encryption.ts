/**
 * Simple encryption plugin using Web Crypto API
 */

/**
 * Check if Web Crypto API is available
 */
export function isEncryptionSupported(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
}

/**
 * Generate encryption key from password
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data with password
 */
export async function encrypt(data: string, password: string): Promise<string> {
  if (!isEncryptionSupported()) {
    console.warn('Encryption not supported, storing unencrypted data');
    return `UNENCRYPTED:${data}`;
  }

  try {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);

    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive key from password
    const key = await deriveKey(password, salt);

    // Encrypt data
    const encryptedBytes = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      dataBytes
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedBytes.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedBytes), salt.length + iv.length);

    // Convert to base64
    let binary = '';
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return `ENCRYPTED:${btoa(binary)}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return `UNENCRYPTED:${data}`;
  }
}

/**
 * Decrypt data with password
 */
export async function decrypt(encryptedData: string, password: string): Promise<string> {
  // Check if data is encrypted
  if (encryptedData.startsWith('UNENCRYPTED:')) {
    return encryptedData.slice('UNENCRYPTED:'.length);
  }

  if (!encryptedData.startsWith('ENCRYPTED:')) {
    // Legacy unencrypted data
    return encryptedData;
  }

  if (!isEncryptionSupported()) {
    throw new Error('Encryption not supported, but data is encrypted');
  }

  try {
    // Remove prefix and decode from base64
    const base64 = encryptedData.slice('ENCRYPTED:'.length);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Extract salt, iv, and encrypted data
    const salt = bytes.slice(0, 16);
    const iv = bytes.slice(16, 28);
    const encryptedBytes = bytes.slice(28);

    // Derive key from password
    const key = await deriveKey(password, salt);

    // Decrypt data
    const decryptedBytes = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encryptedBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBytes);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data. Wrong password?');
  }
}

/**
 * Create encrypted storage adapter wrapper
 */
export function createEncryptedAdapter(
  baseAdapter: any,
  password: string
): any {
  return {
    name: `${baseAdapter.name}-encrypted`,

    async get(key: string): Promise<string | null> {
      const encrypted = await baseAdapter.get(key);
      if (!encrypted) return null;
      try {
        return await decrypt(encrypted, password);
      } catch {
        return null;
      }
    },

    async set(key: string, value: string): Promise<void> {
      const encrypted = await encrypt(value, password);
      return baseAdapter.set(key, encrypted);
    },

    remove(key: string): Promise<void> {
      return baseAdapter.remove(key);
    },

    clear(): Promise<void> {
      return baseAdapter.clear();
    },
  };
}
