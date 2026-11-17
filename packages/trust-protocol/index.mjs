import {identityId as credentialIdentityId,unlock as unlockCredential,signature as signCredential} from '../credential-core/index.mjs';

export const TRUST_ALGORITHM='ECDSA-P256-SHA256-P1363';
export const RECEIPT_FORMAT='kindling-receipt-1';
export const CHALLENGE_FORMAT='kindling-challenge-v1';
export const CHALLENGE_RESPONSE_FORMAT='kindling-challenge-response-v1';
export const CHALLENGE_TTL_MS=10*60*1000;
export const MAX_RECEIPT_BYTES=1024*1024;

const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const hex64=/^[a-f0-9]{64}$/;
const decodeBase64Url=value=>{
 if(typeof value!=='string'||! /^[A-Za-z0-9_-]+$/.test(value))throw new Error('签名或随机数编码无效');
 const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4));
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
};
const encodeBase64Url=value=>{
 let raw='';for(const byte of value)raw+=String.fromCharCode(byte);
 return btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
};
const text=value=>new TextEncoder().encode(value);
const canonicalPublicKey=key=>{
 if(!object(key)||key.kty!=='EC'||key.crv!=='P-256'||typeof key.x!=='string'||typeof key.y!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(key.x)||!/^[A-Za-z0-9_-]{43}$/.test(key.y)||own(key,'d'))throw new Error('公钥格式无效');
 return {kty:key.kty,crv:key.crv,x:key.x,y:key.y};
};
export async function fingerprintPublicKey(value){return credentialIdentityId(canonicalPublicKey(value));}
async function verifySignature(payload,signature,publicKey){
 const bytes=decodeBase64Url(signature);if(bytes.length!==64)return false;
 try{
  const key=await crypto.subtle.importKey('jwk',canonicalPublicKey(publicKey),{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
  return await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,bytes,text(payload));
 }catch{return false;}
}
function requiredString(value,name,max=200000){if(typeof value!=='string'||value.length>max)throw new Error(`${name}格式无效`);return value;}
function parseIso(value,name){
 requiredString(value,name,40);const time=Date.parse(value);
 if(!Number.isFinite(time)||new Date(time).toISOString()!==value)throw new Error(`${name}时间格式无效`);
 return time;
}
function parseChallenge(envelope){
 if(!object(envelope)||envelope.format!==CHALLENGE_FORMAT||envelope.algorithm!==TRUST_ALGORITHM)throw new Error('不支持的挑战文件');
 const payload=requiredString(envelope.payload,'挑战内容',4096),value=JSON.parse(payload);
 if(!object(value)||value.version!=='kindling-identity-challenge-1'||! /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.challenge_id)||!hex64.test(value.identity_id))throw new Error('挑战内容格式无效');
 const canonical=JSON.stringify({version:value.version,challenge_id:value.challenge_id,identity_id:value.identity_id,nonce:value.nonce,issued_at:value.issued_at,expires_at:value.expires_at});
 if(canonical!==payload||typeof value.nonce!=='string'||value.nonce.length!==43||decodeBase64Url(value.nonce).length!==32)throw new Error('挑战随机数或字段顺序无效');
 const issuedAt=parseIso(value.issued_at,'挑战签发时间'),expiresAt=parseIso(value.expires_at,'挑战有效期');
 if(expiresAt<=issuedAt||expiresAt-issuedAt>CHALLENGE_TTL_MS)throw new Error('挑战有效期无效');
 return {payload,value,issuedAt,expiresAt};
}
function assertChallengeLive(challenge,now=Date.now(),allowClockSkew=false){
 if(!allowClockSkew&&now<challenge.issuedAt)throw new Error('设备时间早于挑战签发时间');
 if(now>challenge.expiresAt)throw new Error('挑战已过期，请由核验者重新生成');
}

export async function verifyReceiptEnvelope(envelope,trustedPlatformKeyId=''){
 if(!object(envelope)||envelope.algorithm!==TRUST_ALGORITHM)throw new Error('不支持的回执签名算法');
 const payload=requiredString(envelope.payload,'回执内容',MAX_RECEIPT_BYTES);
 const signature=requiredString(envelope.signature,'平台签名',256);
 const platformKey=canonicalPublicKey(envelope.public_key);
 const platformKeyId=await fingerprintPublicKey(platformKey);
 if(!hex64.test(envelope.key_id||'')||platformKeyId!==envelope.key_id||!await verifySignature(payload,signature,platformKey))throw new Error('平台签章无效');
 const pinned=typeof trustedPlatformKeyId==='string'?trustedPlatformKeyId.trim().toLowerCase():'';
 if(pinned&&(!hex64.test(pinned)||pinned!==platformKeyId))throw new Error('平台公钥印记与独立保存的印记不一致');
 let receipt;try{receipt=JSON.parse(payload);}catch{throw new Error('回执内容不是有效 JSON');}
 if(!object(receipt)||receipt.version!==RECEIPT_FORMAT||typeof receipt.id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(receipt.id))throw new Error('不支持的回执版本或留言编号');
 parseIso(receipt.received_at,'收录时间');parseIso(receipt.server_issued_at,'回执签发时间');
 const proof=receipt.author_proof;
 if(!object(proof)||proof.algorithm!==TRUST_ALGORITHM)throw new Error('作者证明格式无效');
 const authorKey=canonicalPublicKey(proof.public_key),signedPayload=requiredString(proof.signed_payload,'作者签名内容',200000),authorSignature=requiredString(proof.signature,'作者签名',256);
 if(!await verifySignature(signedPayload,authorSignature,authorKey))throw new Error('作者签名无效');
 let submission;try{submission=JSON.parse(signedPayload);}catch{throw new Error('作者签名内容不是有效 JSON');}
 const identityId=await fingerprintPublicKey(authorKey);
 if(!object(submission)||!hex64.test(submission.identityId||'')||identityId!==submission.identityId||submission.id!==receipt.id||submission.consent!==true)throw new Error('作者印记或留言编号与签名不匹配');
 const consentText=requiredString(proof.consent_text,'授权原文',100000),termsHash=await fingerprintText(consentText);
 if(!hex64.test(proof.terms_hash||'')||termsHash!==proof.terms_hash||submission.termsHash!==proof.terms_hash||submission.termsVersion!==proof.terms_version||submission.exceptionId!==proof.training_exception)throw new Error('授权文本摘要或授权版本不匹配');
 if(receipt.releases!==undefined&&!Array.isArray(receipt.releases))throw new Error('数据集版本记录格式无效');
 return {id:receipt.id,identityId,authorPublicKey:authorKey,text:typeof submission.text==='string'?submission.text:'',nickname:typeof submission.nickname==='string'?submission.nickname:'',status:receipt.status,receivedAt:receipt.received_at,issuedAt:receipt.server_issued_at,platformKeyId,platformPinned:!!pinned,releases:receipt.releases||[],receipt};
}

export async function fingerprintText(value){
 const digest=await crypto.subtle.digest('SHA-256',text(value));
 return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}

export async function createIdentityChallenge(identityId,now=Date.now()){
 if(!hex64.test(identityId||''))throw new Error('参与者印记格式无效');
 const issuedAt=new Date(now),expiresAt=new Date(now+CHALLENGE_TTL_MS);
 if(!Number.isFinite(issuedAt.getTime()))throw new Error('设备时间无效');
 const nonce=crypto.getRandomValues(new Uint8Array(32));
 const payload=JSON.stringify({version:'kindling-identity-challenge-1',challenge_id:crypto.randomUUID(),identity_id:identityId,nonce:encodeBase64Url(nonce),issued_at:issuedAt.toISOString(),expires_at:expiresAt.toISOString()});
 return {format:CHALLENGE_FORMAT,algorithm:TRUST_ALGORITHM,payload};
}

export async function signIdentityChallenge(challengeEnvelope,vault,password,now=Date.now()){
 const challenge=parseChallenge(challengeEnvelope);assertChallengeLive(challenge,now,true);
 const identityId=await fingerprintPublicKey(vault?.publicKey);
 if(vault?.format!=='kindling-credential-v1'||vault.identityId!==identityId||identityId!==challenge.value.identity_id)throw new Error('该凭证与挑战指定的参与者印记不匹配');
 const privateKey=await unlockCredential(vault,password);
 try{
  const message=`kindling-identity-challenge-response-v1\n${challenge.payload}`;
  const signature=signCredential(privateKey,message);
  return {format:CHALLENGE_RESPONSE_FORMAT,algorithm:TRUST_ALGORITHM,challenge_payload:challenge.payload,identity_id:identityId,public_key:canonicalPublicKey(vault.publicKey),signature};
 }finally{privateKey.fill(0);}
}

export async function verifyIdentityChallengeResponse(response,{challengeEnvelope,receiptInfo,now=Date.now()}={}){
 const challenge=parseChallenge(challengeEnvelope);assertChallengeLive(challenge,now);
 if(!object(response)||response.format!==CHALLENGE_RESPONSE_FORMAT||response.algorithm!==TRUST_ALGORITHM||response.challenge_payload!==challenge.payload)throw new Error('响应不匹配当前挑战');
 const publicKey=canonicalPublicKey(response.public_key),identityId=await fingerprintPublicKey(publicKey);
 if(!receiptInfo?.platformPinned||identityId!==challenge.value.identity_id||identityId!==receiptInfo.identityId||response.identity_id!==identityId||await fingerprintPublicKey(receiptInfo.authorPublicKey)!==identityId)throw new Error('响应凭证与已固定平台印记的已核验留言不匹配');
 if(!await verifySignature(`kindling-identity-challenge-response-v1\n${challenge.payload}`,response.signature,publicKey))throw new Error('挑战签名无效');
 return {verified:true,challengeId:challenge.value.challenge_id,identityId,verifiedAt:new Date(now).toISOString()};
}
