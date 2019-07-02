precision mediump float;
attribute vec4 a_Position;
attribute vec4 a_Colour;
attribute vec4 a_Normal;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform mat4 u_NormalMatrix;

varying vec4 v_Colour;
varying vec4 v_Normal;

void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_Colour = a_Colour;
    v_Normal = u_NormalMatrix * a_Normal;
}
