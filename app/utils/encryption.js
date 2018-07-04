// @flow
// blockstack.js v17.2.0
import { ec as EllipticCurve } from 'elliptic'
import crypto from 'crypto'

const ecurve = new EllipticCurve('secp256k1')

function aes256CbcEncrypt(iv : Buffer, key : Buffer, plaintext : Buffer) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  return Buffer.concat([cipher.update(plaintext), cipher.final()])
}

function aes256CbcDecrypt(iv : Buffer, key : Buffer, ciphertext : Buffer) {
  const cipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  return Buffer.concat([cipher.update(ciphertext), cipher.final()])
}

function hmacSha256(key : Buffer, content : Buffer) {
  return crypto.createHmac('sha256', key).update(content).digest()
}

function equalConstTime(b1 : Buffer, b2 : Buffer) {
  if (b1.length !== b2.length) {
    return false
  }
  let res = 0
  for (let i = 0; i < b1.length; i++) {
    res |= b1[i] ^ b2[i]  // jshint ignore:line
  }
  return res === 0
}

function sharedSecretToKeys(sharedSecret : Buffer) {
  // generate mac and encryption key from shared secret
  const hashedSecret = crypto.createHash('sha512').update(sharedSecret).digest()
  return { encryptionKey: hashedSecret.slice(0, 32),
           hmacKey: hashedSecret.slice(32) }
}

export function getHexFromBN(bnInput: Object) {
  const hexOut = bnInput.toString('hex')

  if (hexOut.length === 64) {
    return hexOut
  } else if (hexOut.length < 64) {
    // pad with leading zeros
    // the padStart function would require node 9
    const padding = '0'.repeat(64 - hexOut.length)
    return `${padding}${hexOut}`
  } else {
    throw new Error('Generated a > 32-byte BN for encryption. Failing.')
  }
}

/**
 * Encrypt content to elliptic curve publicKey using ECIES
 * @private
 * @param {String} publicKey - secp256k1 public key hex string
 * @param {String | Buffer} content - content to encrypt
 * @return {Object} Object containing (hex encoded):
 *  iv (initialization vector), cipherText (cipher text),
 *  mac (message authentication code), ephemeral public key
 *  wasString (boolean indicating with or not to return a buffer or string on decrypt)
 */
export function encryptECIES(publicKey: string, content: string | Buffer) {
  const isString = (typeof(content) === 'string')
  const plainText = Buffer.from(content) // always copy to buffer

  const ecPK = ecurve.keyFromPublic(publicKey, 'hex').getPublic()
  const ephemeralSK = ecurve.genKeyPair()
  const ephemeralPK = ephemeralSK.getPublic()
  const sharedSecret = ephemeralSK.derive(ecPK)

  const sharedSecretHex = getHexFromBN(sharedSecret)

  const sharedKeys = sharedSecretToKeys(
    new Buffer(sharedSecretHex, 'hex'))

  const initializationVector = crypto.randomBytes(16)

  const cipherText = aes256CbcEncrypt(
    initializationVector, sharedKeys.encryptionKey, plainText)

  const macData = Buffer.concat([initializationVector,
                                 new Buffer(ephemeralPK.encodeCompressed()),
                                 cipherText])
  const mac = hmacSha256(sharedKeys.hmacKey, macData)

  return { iv: initializationVector.toString('hex'),
           ephemeralPK: ephemeralPK.encodeCompressed('hex'),
           cipherText: cipherText.toString('hex'),
           mac: mac.toString('hex'),
           wasString: isString }
}