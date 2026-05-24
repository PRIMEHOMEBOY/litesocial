// lib/ipfs.ts

const PINATA_KEY = process.env.PINATA_API_KEY
const PINATA_SECRET = process.env.PINATA_SECRET_KEY
const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'

export function getIpfsUrl(hash: string): string {
  return `${GATEWAY}/ipfs/${hash}`
}

export function getIpfsFallbackUrl(hash: string): string {
  return `https://ipfs.io/ipfs/${hash}`
}

export async function uploadJsonToIpfs(data: object, name: string): Promise<string> {
  if (!PINATA_KEY || !PINATA_SECRET) {
    console.warn('Pinata keys not set — skipping IPFS upload')
    return 'QmFakeHashForDevelopment'
  }
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      pinata_api_key: PINATA_KEY,
      pinata_secret_api_key: PINATA_SECRET,
    },
    body: JSON.stringify({
      pinataContent: data,
      pinataMetadata: { name },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Pinata error: ${err}`)
  }
  const { IpfsHash } = await res.json()
  return IpfsHash
}

export async function uploadFileToIpfs(file: File): Promise<string> {
  if (!PINATA_KEY || !PINATA_SECRET) {
    console.warn('Pinata keys not set — skipping IPFS upload')
    return 'QmFakeMediaHashForDevelopment'
  }
  const formData = new FormData()
  formData.append('file', file)
  formData.append('pinataMetadata', JSON.stringify({ name: file.name }))

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      pinata_api_key: PINATA_KEY,
      pinata_secret_api_key: PINATA_SECRET,
    },
    body: formData,
  })
  if (!res.ok) throw new Error('Pinata file upload failed')
  const { IpfsHash } = await res.json()
  return IpfsHash
}
