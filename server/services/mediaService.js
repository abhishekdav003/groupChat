
const {
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { randomUUID } = require("crypto");

const s3 = require("../config/s3");

const uploadMedia = async (file) => {
  const fileKey = `chat-media/${randomUUID()}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  const mediaUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      ResponseContentType: file.mimetype,
      ResponseContentDisposition: "inline",
    }),
    { expiresIn: 3600 }
  );

  return {
    fileKey,
    mediaUrl,
    fileName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
  };
};

module.exports = { uploadMedia };
