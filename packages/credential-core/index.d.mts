export function createVault(password:string,randomBytes:(length:number)=>Promise<Uint8Array>):Promise<any>;
export function unlock(v:any,password:string):Promise<Uint8Array>;
export function signature(privateKey:Uint8Array,payload:string):string;
export function identityId(key:any):string;
export function publicKey(privateKey:Uint8Array):any;
export function uuid(bytes:Uint8Array):string;
export function digest(value:string):string;
export function validateNewPassword(password:string):void;
