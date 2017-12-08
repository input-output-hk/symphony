export const webGL2 = (typeof WebGL2RenderingContext !== 'undefined' && renderer.getContext() instanceof WebGL2RenderingContext)

export const depthTexture = !!renderer.extensions.get('WEBGL_depth_texture')

export const multiRenderTargets = !!renderer.extensions.get('WEBGL_draw_buffers')