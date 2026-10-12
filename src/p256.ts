// #region p256 — docs: docs/specification/devices.md#device-keys
/**
 * P-256 public-key validation (DEC-0053), SEC 1 v2 §3.2.2 for an uncompressed point: the encoding is 0x04 ‖ X ‖ Y
 * (65 bytes), so it is never the point at infinity; X and Y are integers in [0, p − 1]; and (X, Y) satisfies the curve
 * equation y² = x³ − 3x + b (mod p). The cofactor of P-256 is 1, so a point on the curve has order n and §3.2.2's last
 * step (nQ = O) holds for every such point. A device key, a policy root key, an offline root or delegation key, and a
 * key-agreement key are checked by it before use; an Ed25519 key is checked by `isSmallOrderKey` instead (DEC-0045).
 */

/** The field prime and the curve's b (SEC 2 v2 §2.4.2, FIPS 186-5 D.1.2.3). */
const P = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn;
const B = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604bn;

/** A 32-byte big-endian coordinate as an integer. */
const toBig = (bytes: Uint8Array) => BigInt(`0x${Buffer.from(bytes).toString("hex")}`);

/** Whether `raw` is a valid uncompressed P-256 public key by SEC 1 §3.2.2. */
export function isValidP256Key(raw: Uint8Array): boolean {
  if (raw.length !== 65 || raw[0] !== 0x04) return false;
  const x = toBig(raw.subarray(1, 33));
  const y = toBig(raw.subarray(33, 65));
  if (x >= P || y >= P) return false;
  const left = (y * y) % P;
  const right = (((x * x) % P) * x - 3n * x + B) % P;
  return left === ((right % P) + P) % P;
}
// #endregion p256
