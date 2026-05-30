/**
 * file-validation.ts — Validação real de tipo MIME por magic bytes
 *
 * Verifica o conteúdo do arquivo (não apenas a extensão ou Content-Type declarado)
 * para garantir que arquivos maliciosos não sejam aceitos com MIME falso.
 */

import { fileTypeFromBuffer } from 'file-type'

export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const ALLOWED_DOC_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number]
export type AllowedDocMime = (typeof ALLOWED_DOC_MIMES)[number]

/**
 * Detecta o MIME real do buffer e valida contra a lista de tipos permitidos.
 * Lança um erro com mensagem em português se o tipo não for permitido.
 */
export async function validateFileMime(
  buffer: Buffer,
  allowed: readonly string[],
): Promise<string> {
  const detected = await fileTypeFromBuffer(buffer)

  // PDF magic bytes: %PDF — file-type retorna 'application/pdf'
  const mime = detected?.mime ?? null

  if (!mime || !allowed.includes(mime)) {
    const allowedLabel = allowed
      .map(m => m.replace('image/', '').replace('application/', '').toUpperCase())
      .join(', ')
    throw new Error(
      `Tipo de arquivo não permitido. Envie apenas: ${allowedLabel}. ` +
      `Arquivo detectado: ${mime ?? 'desconhecido'}.`,
    )
  }

  return mime
}

/**
 * Valida tamanho máximo de arquivo.
 * Lança um erro se exceder o limite.
 */
export function validateFileSize(buffer: Buffer, maxBytes: number): void {
  if (buffer.byteLength > maxBytes) {
    const mb = (maxBytes / 1024 / 1024).toFixed(0)
    throw new Error(`Arquivo muito grande. Tamanho máximo: ${mb}MB.`)
  }
}
