precision mediump float;
attribute vec4 a_Position;
attribute vec4 a_Colour;

uniform mat4 u_ModelMatrix;

varying vec4 v_Colour;

void main() {
    gl_Position = u_ModelMatrix * a_Position;
    v_Colour = a_Colour;
}
