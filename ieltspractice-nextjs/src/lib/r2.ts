import AWS from 'aws-sdk';

// R2 configuration
const r2Client = new AWS.S3({
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: 'auto',
  signatureVersion: 'v4',
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'ielts-practice';

export async function uploadToR2(file: Buffer | Blob, key: string, contentType: string): Promise<string> {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'private' as const,
    };

    const result = await r2Client.upload(params).promise();
    
    // Return the public URL (you'll need to configure your R2 bucket for public access or use signed URLs)
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw new Error('Failed to upload file to R2');
  }
}

export async function generateSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn,
    };

    return r2Client.getSignedUrl('getObject', params);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

export function generateFileKey(userId: string, testId: string, fileType: string): string {
  const timestamp = Date.now();
  return `tests/${userId}/${testId}/${fileType}_${timestamp}.wav`;
}
