# Kindling Verification Standard v1

Status: Initial public specification, published 2026-10-31.

This specification is licensed under Creative Commons Attribution 4.0 International (CC BY 4.0). It may be independently implemented in any programming language.

This document defines independent verification for Kindling (`火种纪`) receipt files and a one-time proof-of-possession challenge for participant credentials. A conforming verifier can operate without the Kindling website or network access.

## 1. Security and privacy model

- A receipt carries an author signature over the exact submission payload and a Kindling platform signature over the receipt payload.
- A participant credential is an encrypted local ECDSA P-256 private key. Its passphrase decrypts the key locally; it is not needed to verify receipts and is never part of a receipt or challenge response.
- A challenge response proves that its signer currently controls the private key matching the participant public key in a verified receipt. It does not establish a civil name, email address, or legal identity.
- A platform signature is trusted only when its public-key fingerprint matches an independently obtained trust anchor. A key embedded in the same receipt is not, by itself, an identity claim.
- V1 verification checks the platform-signed dataset release references in the receipt. It does not download Hugging Face files. Checking the contents of a referenced dataset commit requires separately obtaining and hashing those files or a future inclusion-proof format.
- Receipt text and credential files are untrusted input. Verifiers must render text as text, never as HTML, and must not upload receipt or credential contents.

## 2. Encodings and fingerprints

The signature algorithm identifier is `ECDSA-P256-SHA256-P1363`: ECDSA over P-256, SHA-256, and a 64-byte IEEE-P1363 `r || s` signature encoded as unpadded base64url. UTF-8 bytes are signed. Verifiers must not parse and reserialize a signed payload before checking its signature.

The participant/platform key fingerprint is lowercase hexadecimal SHA-256 over the UTF-8 bytes of the compact JSON representation below. Property order and absence of whitespace are significant. `x` and `y` are unpadded base64url P-256 coordinates, each 43 characters:

```json
{"kty":"EC","crv":"P-256","x":"<43-char base64url>","y":"<43-char base64url>"}
```

This fingerprint is also called `identity_id` for a participant and `key_id` for the platform.

## 3. Receipt envelope

The receipt envelope is JSON with these required fields:

```json
{
  "payload": "<exact UTF-8 JSON string signed by the platform>",
  "signature": "<base64url IEEE-P1363 signature>",
  "public_key": {"kty":"EC","crv":"P-256","x":"...","y":"..."},
  "key_id": "<platform public-key fingerprint>",
  "algorithm": "ECDSA-P256-SHA256-P1363"
}
```

`payload` parses as `kindling-receipt-1`. It contains the record ID, signed author proof, receipt status and timestamps, dataset release references, and transparency events. The author proof contains `signed_payload`, `signature`, `public_key`, `algorithm`, `terms_version`, `terms_hash`, `consent_text`, and the training exception identifier.

A verifier performs these checks in order:

1. Validate the envelope shape, algorithm and public-key fields.
2. Recompute `key_id` from `public_key`; compare it with the envelope value and any independently saved platform fingerprint.
3. Verify `signature` over the exact UTF-8 bytes in `payload` using the envelope public key.
4. Parse `payload`; require version `kindling-receipt-1` and a valid record ID.
5. Verify the author signature over the exact UTF-8 bytes in `author_proof.signed_payload`.
6. Recompute the author key fingerprint and compare it with the signed submission's `identityId`.
7. Check that the signed submission ID matches the receipt ID, `consent` is true, the SHA-256 of `consent_text` matches `terms_hash`, and the signed terms version, terms hash and training exception match the author proof.
8. Display the signed status, timestamps and release references as platform-attested data. Do not describe the references as independently fetched or hashed unless those dataset files were separately checked.

Without a trusted platform fingerprint, a verifier may report that the signatures are mathematically valid, but must label the platform identity as unpinned. The initial anchor is in `kindling-trust-anchor-v1.json`; its fingerprint is `948ace7b28cb8f864d14b0ba892fcec6cea3ddca1452f8b8cec1347998a1d65c`. Save and compare this fingerprint through more than one independent distribution channel. V1 does not auto-accept a replacement platform key; a changed key requires a separately authenticated update to the verifier's trust anchor.

## 4. Identity challenge

A verifier creates a new challenge using a cryptographically secure random 32-byte nonce. Challenge payload is a compact JSON string with the property order shown here; the exact string is carried in the challenge file and later signed:

```json
{"version":"kindling-identity-challenge-1","challenge_id":"<UUIDv4>","identity_id":"<participant fingerprint>","nonce":"<32 bytes, unpadded base64url>","issued_at":"<UTC ISO-8601 milliseconds>","expires_at":"<UTC ISO-8601 milliseconds>"}
```

The challenge file is:

```json
{"format":"kindling-challenge-v1","algorithm":"ECDSA-P256-SHA256-P1363","payload":"<exact challenge payload string>"}
```

`expires_at` must be later than `issued_at` and no more than ten minutes later. The holder imports their credential backup, enters the passphrase locally, and signs this exact message:

The signed bytes are the ASCII/UTF-8 text `kindling-identity-challenge-response-v1`, followed by one LF byte (`0x0A`), followed by the exact UTF-8 bytes of `payload`.

The response file is:

```json
{
  "format":"kindling-challenge-response-v1",
  "algorithm":"ECDSA-P256-SHA256-P1363",
  "challenge_payload":"<exact payload string>",
  "identity_id":"<participant fingerprint>",
  "public_key":{"kty":"EC","crv":"P-256","x":"...","y":"..."},
  "signature":"<base64url IEEE-P1363 signature>"
}
```

The verifier checks that the response contains the exact challenge it issued, the challenge has not expired or already been accepted in this verifier session, the challenge identity matches the verified receipt, the response public key fingerprints to that identity, and the signature is valid. A challenge must be generated by the verifier for the live verification; do not accept a response to a challenge supplied only by the claimant. The standalone tool keeps one outstanding challenge in memory and consumes it after successful verification. Closing or reloading the tool discards it; issue a new challenge afterward.

The passphrase and private key never enter the response file. Only the public key, challenge and signature are exported. The challenge holder can be on a separate device; transfer the challenge and response files directly between parties.

## 5. Credential file

V1 accepts the JSON `kindling-credential-v1` vault produced by the site, or its HTML private envelope containing exactly one `script#kindling-credential[type="application/json"]`. A signer must check the vault public-key fingerprint before decrypting, decrypt only in memory, verify the private/public key pair, sign, and clear the passphrase and private-key bytes from application references immediately after signing.

## 6. Offline verifier behavior

The downloadable `kindling-offline-verifier-v1.html` is a self-contained artifact. It has no remote scripts, fonts, images, API calls, analytics or network requests. It can be opened from a local file and uses the browser's Web Crypto implementation. The published source and this specification are the interoperable reference; any third party may implement the same checks in another language.

The challenge proof is replay-resistant only when the verifier generated a fresh random challenge and checks its own outstanding challenge once. A saved old response can prove that a key signed that old challenge, but cannot prove current control of the key.

## 7. Public test vectors

`test-vectors-v1.json` contains a valid synthetic receipt, a valid challenge/response pair, and tampered negative cases. Its platform and participant keys and fictional content are test-only; none correspond to Kindling or a real participant. Implementations should accept the valid receipt and challenge response and reject both tampered cases.
