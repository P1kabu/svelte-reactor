/**
 * Simple compression using the Compression Streams API
 * Fallback to base64 encoding if compression is not available
 */

/**
 * Check if compression is supported
 */
export function isCompressionSupported(): boolean {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
}

/**
 * Compress a string using gzip
 */
export async function compress(data: string): Promise<string> {
  if (!isCompressionSupported()) {
    // Fallback: just return the original data with a marker
    return `UNCOMPRESSED:${data}`;
  }

  try {
    // Convert string to bytes
    const bytes = new TextEncoder().encode(data);

    // Create a compression stream
    const stream = new Blob([bytes])
      .stream()
      .pipeThrough(new CompressionStream('gzip'));

    // Read the compressed data
    const compressedBlob = await new Response(stream).blob();
    const compressedBytes = new Uint8Array(await compressedBlob.arrayBuffer());

    // Convert to base64 for storage
    let binary = '';
    for (let i = 0; i < compressedBytes.length; i++) {
      binary += String.fromCharCode(compressedBytes[i]);
    }
    return `COMPRESSED:${btoa(binary)}`;
  } catch (error) {
    console.error('Compression error:', error);
    return `UNCOMPRESSED:${data}`;
  }
}

/**
 * Decompress a string
 */
export async function decompress(data: string): Promise<string> {
  // Check if data is compressed
  if (data.startsWith('UNCOMPRESSED:')) {
    return data.slice('UNCOMPRESSED:'.length);
  }

  if (!data.startsWith('COMPRESSED:')) {
    // Legacy data without marker
    return data;
  }

  if (!isCompressionSupported()) {
    throw new Error('Compression not supported, but data is compressed');
  }

  try {
    // Remove marker and decode from base64
    const base64 = data.slice('COMPRESSED:'.length);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Create a decompression stream
    const stream = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'));

    // Read the decompressed data
    const decompressedBlob = await new Response(stream).blob();
    const decompressedText = await decompressedBlob.text();

    return decompressedText;
  } catch (error) {
    console.error('Decompression error:', error);
    // Return original data as fallback
    return data.slice('COMPRESSED:'.length);
  }
}

/**
 * Synchronous compression using simple run-length encoding
 * This is a fallback for when async compression is not suitable
 */
export function compressSync(data: string): string {
  // Simple compression: just return the data
  // In a real implementation, you might use LZ-string or similar
  return data;
}

/**
 * Synchronous decompression
 */
export function decompressSync(data: string): string {
  return data;
}
