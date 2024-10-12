import {ShaderChunk} from 'three';

export function unrollLoops(source: string, defines: Record<string, any>) {
  const pattern = /#pragma unroll_loop\s+for\s*\(\s*int\s+i\s*=\s*(\w+);\s*i\s+<\s+(\w+);\s*i\s*\+\+\s*\)\s*\{\n([^}]*)\}/g;
  function replace(match: string, start: string, end: string, snippet: string) {
    let result = '';
    const s = start in defines ? defines[start] : Number.parseInt(start, 10);
    const e = end in defines ? defines[end] : Number.parseInt(end, 10);
    for (let i = s; i < e; i++) {
      result += snippet.replace(/\bi\b/g, ` ${i} `);
    }
    return result;
  }
  return source.replace(pattern, replace);
}

export function registerShaderChunk(key: string, source: string) {
  // @ts-expect-error resigter new key
  ShaderChunk[key] = source;
}
