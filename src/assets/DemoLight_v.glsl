precision mediump float;
attribute vec4 a_Position;
attribute vec4 a_Normal;

uniform mat4 u_MVPMatrix;
uniform mat4 u_NormalMatrix;

varying vec4 v_Normal;

void main() {
    gl_Position = u_MVPMatrix * a_Position;
    v_Normal = u_NormalMatrix * a_Normal;
}
