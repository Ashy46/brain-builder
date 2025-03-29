import crypto from "crypto";

const secret = process.env.ENCRYPTION_SECRET!;
const key = Buffer.from(secret, "base64");
const algorithm = "aes-256-gcm";

export function encrypt(text: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    content: encrypted,
    tag: tag.toString("base64"),
  };
}

export function decrypt(encryptedData: {
  iv: string;
  content: string;
  tag: string;
}) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(encryptedData.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(encryptedData.tag, "base64"));

  let decrypted = decipher.update(encryptedData.content, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
