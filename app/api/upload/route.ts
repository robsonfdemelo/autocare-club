import { NextResponse } from 'next/server'
import { cloudinary } from '../../../lib/cloudinary'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json(
      { error: 'Arquivo não informado.' },
      { status: 400 }
    )
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: 'autocare-club/workshops',
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            reject(error)
            return
          }

          resolve({ secure_url: result.secure_url })
        }
      )
      .end(buffer)
  })

  return NextResponse.json({
    url: result.secure_url,
  })
}