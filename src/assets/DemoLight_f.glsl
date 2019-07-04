precision mediump float;

uniform vec3 u_LightColour;
uniform vec3 u_LightDirection;
uniform vec3 u_AmbientLight;

varying vec4 v_Normal;
const vec4 vertexColour = vec4(1.0, 1.0, 1.0, 1.0);

void main() {
    vec3 normal = normalize(vec3(v_Normal));
    float normalDotLight = max(dot(u_LightDirection, normal), 0.0);
    vec3 diffuse = u_LightColour * normalDotLight;
    vec3 ambient = u_AmbientLight;
    vec4 light = vec4(diffuse + ambient, 1.0);

    gl_FragColor = vertexColour * light;
}
