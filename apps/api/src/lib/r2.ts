import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

function getS3(): S3Client {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 environment variables are not set')
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const s3 = getS3()
  const bucket = process.env.R2_BUCKET_NAME ?? 'petmatch'
  const publicUrl = process.env.R2_PUBLIC_URL ?? ''
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType }))
  return `${publicUrl}/${key}`
}

export async function deleteFile(key: string): Promise<void> {
  const s3 = getS3()
  const bucket = process.env.R2_BUCKET_NAME ?? 'petmatch'
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}
