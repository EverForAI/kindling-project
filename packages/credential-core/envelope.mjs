import {parseDocument,DomUtils} from 'htmlparser2';
export function extractCredential(raw){
 if(typeof raw!=='string'||raw.length>2*1024*1024)throw new Error('凭证文件格式或大小无效');
 if(!raw.trimStart().startsWith('<'))return JSON.parse(raw);
 const document=parseDocument(raw),matches=DomUtils.findAll(node=>node.name==='script'&&node.attribs?.id==='kindling-credential'&&node.attribs?.type==='application/json',document.children);
 if(matches.length!==1)throw new Error('封套没有唯一有效的凭证备份');
 return JSON.parse(DomUtils.textContent(matches[0]));
}
