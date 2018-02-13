uniform float size;
uniform float scale;
uniform float uTime;
uniform sampler2D uColor;
uniform float pointCount;

attribute float id;
varying float display;

#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {

	#include <color_vertex>
	#include <begin_vertex>
	#include <project_vertex>

	#ifdef USE_SIZEATTENUATION
		gl_PointSize = size * ( scale / - mvPosition.z );
	#else
		gl_PointSize = size;
	#endif

	// get color from texture
	vec4 sampleColor = texture2D(uColor, vec2((id / 3.0) / pointCount, 0.0));

	float mod3 = mod(id, 3.0);

	if (mod3 == 0.0) {
		display = float(sampleColor.r);
	}
	if (mod3 == 1.0) {
		display = float(sampleColor.g);
	}
	if (mod3 == 2.0) {
		display = float(sampleColor.b);
	}

	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

}
