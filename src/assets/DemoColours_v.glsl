precision mediump float;
attribute vec4 a_Position;
attribute vec4 a_Colour;
varying vec4 v_Colour;

void main() {
    gl_Position = a_Position;
    v_Colour = a_Colour;
}
