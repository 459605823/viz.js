import {registerShaderChunk} from '@/utils';

class ShaderChunkManager {
  private prefix = 'viz/';

  install(chunks: Record<string, string>) {
    Object.keys(chunks).forEach((key) => {
      registerShaderChunk(this.prefix + key, chunks[key]);
    });
  }
}

export const shaderChunkManager = new ShaderChunkManager();
export {vizShaderChunks} from './chunk';
