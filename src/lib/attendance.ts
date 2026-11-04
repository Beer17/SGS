// src/lib/attendance.ts
// Normalización de códigos escaneados (QR de credencial o URL de verificación).

/**
 * Acepta:
 *   - el código crudo (uuid de codigoCredencialQR)
 *   - una URL completa de verificación: https://app/api/credencial/verify?code=<codigo>
 * Devuelve el código o null si no se puede interpretar.
 */
export function extractCredentialCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // URL completa → extraer el parámetro code
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const code = url.searchParams.get('code');
      return code ? code.trim() : null;
    } catch {
      return null;
    }
  }

  // Fragmento del tipo "...?code=xyz" sin esquema
  const match = trimmed.match(/[?&]code=([^&]+)/i);
  if (match?.[1]) return decodeURIComponent(match[1]).trim();

  // Código crudo: uuid o id razonable
  if (/^[A-Za-z0-9-]{6,64}$/.test(trimmed)) return trimmed;

  return null;
}
