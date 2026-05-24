export const dynamic = 'force-dynamic'
// app/api/posts/upload/route.ts
import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { ok, err, handleError } from '@/lib/api-helpers'
import { getIpfsUrl } from '@/lib/ipfs'

export async function POST(req: NextRequest) {
  try {
    await requireAuth()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return err('No file provided')

    // Validate type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) return err('Invalid file type. Allowed: JPEG, PNG, GIF, WebP')
    if (file.size > 10 * 1024 * 1024) return err('File too large. Max 10MB')

    const PINATA_KEY = process.env.PINATA_API_KEY
    const PINATA_SECRET = process.env.PINATA_SECRET_KEY

    if (!PINATA_KEY || !PINATA_SECRET) {
      // Dev mode: return a placeholder
      return ok({ hash: 'QmDevPlaceholderHash', url: '' })
    }

    const uploadForm = new FormData()
    uploadForm.append('file', file)
    uploadForm.append('pinataMetadata', JSON.stringify({ name: `litesocial-media-${Date.now()}` }))

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        pinata_api_key: PINATA_KEY,
        pinata_secret_api_key: PINATA_SECRET,
      },
      body: uploadForm,
    })

    if (!res.ok) return err('IPFS upload failed')

    const { IpfsHash } = await res.json()
    return ok({ hash: IpfsHash, url: getIpfsUrl(IpfsHash) })
  } catch (error) {
    return handleError(error)
  }
}
