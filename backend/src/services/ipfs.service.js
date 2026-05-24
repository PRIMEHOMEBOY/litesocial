import PinataSDK from '@pinata/sdk';
import { Readable } from 'stream';
import { logger } from '../lib/logger.js';

let pinata;
try {
  pinata = new PinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);
} catch (e) {
  logger.warn('Pinata SDK init failed:', e.message);
}

export async function uploadPostToIPFS(postData) {
  if (!pinata) return `mock_ipfs_${Date.now()}`;
  try {
    const result = await pinata.pinJSONToIPFS(postData, {
      pinataMetadata: { name: `litesocial-post-${Date.now()}` }
    });
    return result.IpfsHash;
  } catch (e) {
    logger.error('IPFS upload failed:', e.message);
    return `fallback_${Date.now()}`;
  }
}

export async function uploadImageToIPFS(fileBuffer, filename) {
  if (!pinata) return `mock_img_${Date.now()}`;
  try {
    const stream = Readable.from(fileBuffer);
    stream.path = filename;
    const result = await pinata.pinFileToIPFS(stream, {
      pinataMetadata: { name: filename }
    });
    return result.IpfsHash;
  } catch (e) {
    logger.error('IPFS image upload failed:', e.message);
    return null;
  }
}

export function getIPFSUrl(hash) {
  if (!hash || hash.startsWith('mock_') || hash.startsWith('fallback_')) return null;
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
}

// Fallback to public gateway if Pinata is slow
export function getIPFSUrlWithFallback(hash) {
  return [
    `https://gateway.pinata.cloud/ipfs/${hash}`,
    `https://ipfs.io/ipfs/${hash}`,
  ];
}
