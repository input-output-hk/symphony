uniform vec3 diffuse;
uniform float opacity;
uniform float uTime;
uniform sampler2D uColor;

varying float display;

#include <common>

float circle(in float dist, in float radius) {
	return 1.0 - smoothstep(
		radius - (radius * 2.0),
		radius + (radius * 0.00001),
        dot(dist, dist) * 4.0
	);
}

void main() {

	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );

	vec2 uv = ( vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;

	vec2 pos = uv;
	pos -= 0.5;

	float dist = length(pos);

	outgoingLight = diffuseColor.rgb;
	vec3 color = vec3(circle(dist, 0.9));
	color *= sin((dist * 65.0) - (uTime * 30.0));
	color *= diffuseColor.rgb;
	color *= display;

	gl_FragColor = vec4( color, 1.0 );


}
