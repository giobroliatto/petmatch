import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

function isConfigured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  )
}

function getS3(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

/**
 * Uploads a file to R2.
 * Returns the public URL on success, or null when R2 is not configured.
 * Throws on upload errors (wrong credentials, bucket missing, etc.).
 */
export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string | null> {
  if (!isConfigured()) {
    console.warn(`[R2] Not configured — skipping upload for key "${key}"`)
    return null
  }
  const s3 = getS3()
  const bucket = process.env.R2_BUCKET_NAME ?? 'petmatch'
  const publicUrl = process.env.R2_PUBLIC_URL ?? ''
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType }))
  return `${publicUrl}/${key}`
}

/**
 * Deletes a file from R2.
 * Silently skips when R2 is not configured.
 */
export async function deleteFile(key: string): Promise<void> {
  if (!isConfigured()) {
    console.warn(`[R2] Not configured — skipping delete for key "${key}"`)
    return
  }
  const s3 = getS3()
  const bucket = process.env.R2_BUCKET_NAME ?? 'petmatch'
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}
