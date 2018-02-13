#pragma glslify: snoise4 = require(./simplexNoiseDerivatives4)

vec3 curl( in vec3 p, in float noiseTime, in float persistence ) {

    vec3 p1 = p + vec3(123.4, 129845.6, -1239.1);

    vec4 xNoisePotentialDerivatives = snoise4(vec4(p, noiseTime));
    vec4 yNoisePotentialDerivatives = snoise4(vec4(p1, noiseTime));

    return vec3(
        yNoisePotentialDerivatives[1] - xNoisePotentialDerivatives[1],
        yNoisePotentialDerivatives[2] - xNoisePotentialDerivatives[2],
        yNoisePotentialDerivatives[0] - xNoisePotentialDerivatives[0]
    );

}

#pragma glslify: export(curl)
