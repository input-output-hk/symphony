uniform vec3 diffuse;
uniform float opacity;
uniform float uTime;
uniform sampler2D uColor;

varying float display;

#include <common>
#include <packing>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <fog_pars_fragment>
#include <shadowmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

float circle(in float dist, in float radius) {
	return 1.0 - smoothstep(
		radius - (radius * 10.0),
		radius + (radius * 0.01),
        dot(dist, dist) * 3.0
	);
}

void main() {

	#include <clipping_planes_fragment>

	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );

	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
//	#include <alphatest_fragment>

	vec2 uv = ( vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;

	vec2 pos = uv;
	pos -= 0.5;

	float dist = length(pos);

	outgoingLight = diffuseColor.rgb;
	vec3 color = vec3(circle(dist, 0.9));
	color *= sin((dist * 100.0) - (uTime * 30.0));
	color *= diffuseColor.rgb;
	color *= display;

	gl_FragColor = vec4( color, 1.0 );

	#include <premultiplied_alpha_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	//#include <fog_fragment>

}
