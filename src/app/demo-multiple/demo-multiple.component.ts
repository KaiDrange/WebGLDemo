import { Component, OnInit, ViewChild, ElementRef, HostListener, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { mat4, vec3, vec4 } from 'gl-matrix';

import * as OBJ from 'webgl-obj-loader';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-demo-multiple',
  templateUrl: './demo-multiple.component.html',
  styleUrls: ['./demo-multiple.component.scss']
})

export class DemoMultipleComponent implements OnInit {
  @ViewChild('glCanvas', {static: true}) glCanvas: ElementRef<HTMLCanvasElement>;
  gl: WebGLRenderingContext;
  vshaderSource: string;
  fshaderSource: string;
  program: WebGLProgram;
  viewMatrix: mat4;
  projectionMatrix: mat4;
  lights: Lights;
  prevDrawTime: number;
  sceneObjects: Array<SceneObject> = [];

  constructor(private httpClient: HttpClient) { }

  async ngOnInit() {
    await this.loadShaders();
    this.initWebGL();
    if (this.gl) {
      await this.loadObjects();
      this.setLights();
      this.prevDrawTime = Date.now();
      this.sceneObjects.forEach((so) => so.animate(0, this.viewMatrix, this.projectionMatrix));
      this.drawScene();
    }
  }

  initWebGL() {
    let gl = this.glCanvas.nativeElement.getContext('webgl');
    if (!gl) {
      gl = this.glCanvas.nativeElement.getContext('experimental-webgl') as WebGLRenderingContext;
    }
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    this.gl = gl;

    const vshader = this.createShader(gl.VERTEX_SHADER, this.vshaderSource);
    const fshader = this.createShader(gl.FRAGMENT_SHADER, this.fshaderSource);
    this.program = this.createProgram(vshader, fshader);
    gl.useProgram(this.program);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    this.viewMatrix = this.createViewMatrix();
    this.projectionMatrix = this.createProjectionMatrix();
  }

  drawScene() {
    this.resizeCanvas();
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.sceneObjects.forEach((so) => so.draw(this.lights));
    const now = Date.now();
    const timeDelta = now - this.prevDrawTime;
    this.prevDrawTime = now;
    this.sceneObjects.forEach((so) => so.animate(timeDelta, this.viewMatrix, this.projectionMatrix));
    window.requestAnimationFrame(() => { this.drawScene(); });
  }

  createProgram(vshader: WebGLShader, fshader: WebGLShader): WebGLProgram {
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vshader);
    this.gl.attachShader(program, fshader);
    this.gl.linkProgram(program);
    const success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
    if (success) {
      return program;
    }

    console.log(this.gl.getProgramInfoLog(program));
    this.gl.deleteProgram(program);
    return null;
  }

  async loadShaders() {
    this.vshaderSource = await this.httpClient.get('assets/DemoMultiple_v.glsl', { responseType: 'text' }).toPromise();
    this.fshaderSource = await this.httpClient.get('assets/DemoMultiple_f.glsl', { responseType: 'text' }).toPromise();
  }

  async loadObjects() {
    const torusObj = await this.httpClient.get('assets/torus.obj', { responseType: 'text' }).toPromise();
    const torus: SceneObject = new SceneObject(this.gl, new OBJ.Mesh(torusObj), this.program);
    torus.animation.position = vec3.fromValues(6.0, 4.0, -5.0);
    torus.animation.rotationSpeed = vec3.fromValues(2.0, 0.0, 0.0);
    torus.modelColour = vec4.fromValues(0.7, 0.8, 1.0, 1.0);
    torus.isWireframe = true;
    this.sceneObjects.push(torus);

    const cylinderObj = await this.httpClient.get('assets/cylinder.obj', { responseType: 'text' }).toPromise();
    const cylinder: SceneObject = new SceneObject(this.gl, new OBJ.Mesh(cylinderObj), this.program);
    cylinder.animation.position = vec3.fromValues(-5.0, 1.0, -5.0);
    cylinder.animation.movementSpeed = vec3.fromValues(0.0, 1.0, 0.0);
    cylinder.modelColour = vec4.fromValues(0.7, 0.8, 1.0, 1.0);
    this.sceneObjects.push(cylinder);

    const planeObj = await this.httpClient.get('assets/plane.obj', { responseType: 'text' }).toPromise();
    const plane: SceneObject = new SceneObject(this.gl, new OBJ.Mesh(planeObj), this.program);
    plane.animation.scale = vec3.fromValues(10.0, 1.0, 10.0);
    plane.animation.position = vec3.fromValues(-4.0, 0.0, -5.0);
    this.sceneObjects.push(plane);

    const sphereObj = await this.httpClient.get('assets/sphere.obj', { responseType: 'text' }).toPromise();
    const sphere: SceneObject = new SceneObject(this.gl, new OBJ.Mesh(sphereObj), this.program);
    sphere.animation.position = vec3.fromValues(0.0, 2.0, 0.7);
    sphere.animation.rotationSpeed = vec3.fromValues(0.0, 1.0, 0.0);
    sphere.modelColour = vec4.fromValues(0.7, 0.8, 1.0, 0.75);
    sphere.isTransparent = false;
    this.sceneObjects.push(sphere);
  }

  createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }

    console.log(this.gl.getShaderInfoLog(shader));
    this.gl.deleteShader(shader);
    return null;
  }

  createProjectionMatrix(): mat4 {
    const fieldOfView = (90 * Math.PI)/180;
    const canvas = this.gl.canvas as HTMLCanvasElement;
    const ratio =  canvas.clientWidth/canvas.clientHeight;
    const near = 1;
    const far = 100;

    const pMatrix = mat4.create();
    mat4.perspective(pMatrix, fieldOfView, ratio, near, far);
    return pMatrix;
  }

  createViewMatrix(): mat4 {
    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, [0.0, 3.0, 3.5], [0.0, 0.0, -100], [0.0, 1.0, 0.0]);
    return viewMatrix;
  }

  setLights() {
    this.lights = new Lights();
    this.lights.direction = vec3.fromValues(-1.0, 1.0, 2.0);
    this.lights.colour = vec3.fromValues(0.7, 0.7, 0.7);
    this.lights.ambient = vec3.fromValues(0.3, 0.3, 0.3);
    vec3.normalize(this.lights.direction, this.lights.direction);
  }
  
  resizeCanvas() {
    if (!this.gl) {
      return;
    }
   
    const canvas = this.gl.canvas as HTMLCanvasElement;
    if (canvas.width != canvas.clientWidth || canvas.height != canvas.clientHeight) {
        canvas.width  = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        this.gl.viewport(0, 0, canvas.width, canvas.height);
        this.projectionMatrix = this.createProjectionMatrix();
      }
  }
}

class SceneObject {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  model: OBJ.Mesh;
  modelColour: vec4;
  isTransparent: boolean;
  isWireframe: boolean;
  a_Position: number;
  a_Normal: number;
  u_NormalMatrix: WebGLUniformLocation;
  u_MVPMatrix: WebGLUniformLocation;
  u_LightDirection: WebGLUniformLocation;
  u_LightColour: WebGLUniformLocation;
  u_AmbientLight: WebGLUniformLocation;
  u_FragColour: WebGLUniformLocation;
  vertexBuffer: WebGLBuffer;
  normalBuffer: WebGLBuffer;
  indexBuffer: WebGLBuffer;
  animation: Animation;
  mvpMatrix: mat4;
  normalMatrix: mat4;

  constructor(gl: WebGLRenderingContext, model: OBJ.Mesh, program: WebGLProgram) {
    this.gl = gl;
    this.program = program;
    this.gl.useProgram(this.program);
    this.model = model;
    this.modelColour = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
    this.isTransparent = false;
    this.isWireframe = false;
    this.createBuffers();
    this.u_MVPMatrix = this.gl.getUniformLocation(this.program, 'u_MVPMatrix');
    this.u_NormalMatrix = this.gl.getUniformLocation(this.program, 'u_NormalMatrix');
    this.u_LightDirection = this.gl.getUniformLocation(this.program, 'u_LightDirection');
    this.u_LightColour = this.gl.getUniformLocation(this.program, 'u_LightColour');
    this.u_AmbientLight = this.gl.getUniformLocation(this.program, 'u_AmbientLight');
    this.u_FragColour = this.gl.getUniformLocation(this.program, 'u_FragColour');

    this.animation = new Animation();
  }

  createBuffers(): void {
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.model.vertices), this.gl.STATIC_DRAW);
    this.a_Position = this.gl.getAttribLocation(this.program, 'a_Position');

    this.normalBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.model.vertexNormals), this.gl.STATIC_DRAW);
    this.a_Normal = this.gl.getAttribLocation(this.program, 'a_Normal');

    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.model.indices), this.gl.STATIC_DRAW);
  }

  draw(lights: any): void {
    this.gl.enable(this.gl.BLEND);
    this.gl.frontFace(this.gl.CCW);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.cullFace(this.gl.BACK);
    if (this.isTransparent) {
      this.gl.depthMask(false);
      this.gl.disable(this.gl.CULL_FACE);
    } else {
      this.gl.depthMask(true);
      this.gl.enable(this.gl.CULL_FACE);
    }

    this.gl.useProgram(this.program);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.a_Position);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
    this.gl.vertexAttribPointer(this.a_Normal, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.a_Normal);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    this.gl.uniformMatrix4fv(this.u_MVPMatrix, false, this.mvpMatrix);
    
    this.gl.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix);

    this.gl.uniform3fv(this.u_LightDirection, lights.direction);
    this.gl.uniform3fv(this.u_LightColour, lights.colour);
    this.gl.uniform3fv(this.u_AmbientLight, lights.ambient);
    this.gl.uniform4fv(this.u_FragColour, this.modelColour);

    if (this.isWireframe) {
      this.gl.drawElements(this.gl.LINES, this.model.indices.length, this.gl.UNSIGNED_SHORT, 0);
    } else {
      this.gl.drawElements(this.gl.TRIANGLES, this.model.indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
  }

  animate(timeDelta: number, viewMatrix: mat4, projectionMatrix: mat4) {
    for (let i = 0; i < 3; i++) {
      if (this.animation.position[i] > 10 && this.animation.movementSpeed[i] > 0) {
        this.animation.movementSpeed[i] *= -1;
      } else if (this.animation.position[i] < 2 && this.animation.movementSpeed[i] < 0) {
        this.animation.movementSpeed[i] *= -1;
      }
    }

    const move_change = vec3.create();
    vec3.scale(move_change, this.animation.movementSpeed, timeDelta/1000);
    vec3.add(this.animation.position, this.animation.position, move_change);

    const rot_change = vec3.create();
    vec3.scale(rot_change, this.animation.rotationSpeed, timeDelta/1000);
    vec3.add(this.animation.angle, this.animation.angle, rot_change);

    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, this.animation.position);
    mat4.rotate(modelMatrix, modelMatrix, vec3.length(this.animation.angle), this.animation.angle);
    mat4.scale(modelMatrix, modelMatrix, this.animation.scale);

    this.mvpMatrix = mat4.create();
    mat4.multiply(this.mvpMatrix, projectionMatrix, viewMatrix);
    mat4.multiply(this.mvpMatrix, this.mvpMatrix, modelMatrix);

    this.normalMatrix = mat4.create();
    mat4.invert(this.normalMatrix, modelMatrix);
    mat4.transpose(this.normalMatrix, this.normalMatrix);
  }
}

class Lights {
  direction: vec3;
  colour: vec3;
  ambient: vec3;
}

class Animation {
  position: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
  movementSpeed: vec3 = vec3.fromValues(0.0, 0.0, 0.0);;
  scale: vec3 = vec3.fromValues(1.0, 1.0, 1.0);
  angle: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
  rotationSpeed: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
}