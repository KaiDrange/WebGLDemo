import { Component, OnInit, ViewChild, ElementRef, HostListener, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { mat4, vec3 } from 'gl-matrix';

@Component({
  selector: 'app-demo-texture',
  templateUrl: './demo-texture.component.html',
  styleUrls: ['./demo-texture.component.scss']
})

export class DemoTextureComponent implements OnInit {
  @ViewChild("glCanvas", {static: true}) glCanvas: ElementRef<HTMLCanvasElement>;
  gl: WebGLRenderingContext;
  vshaderSource: string;
  fshaderSource: string;
  program: WebGLProgram;
  model: Model;
  prevDrawTime: number;
  u_MVPMatrix: WebGLUniformLocation;
  u_NormalMatrix: WebGLUniformLocation;
  jsonModel: any;
  texture: HTMLImageElement;
  assetsLoaded = new EventEmitter();

  constructor(private httpClient: HttpClient) { }

  async ngOnInit() {
    await this.loadAssets();
    this.assetsLoaded.subscribe(() => {
      this.createModel();
      this.initWebGL();
      if (this.gl) {
        this.initArrayBuffer(this.model.vertices, this.model.vertexSize, this.gl.FLOAT, 'a_Position', this.program);
        this.initArrayBuffer(this.model.normals, this.model.normalSize, this.gl.FLOAT, 'a_Normal', this.program);
        this.initArrayBuffer(this.model.textureCoords, this.model.textureCoordSize, this.gl.FLOAT, 'a_TexCoord', this.program);
        this.initIndexBuffer();
        this.initTexture();
        this.setLights();
        this.prevDrawTime = Date.now();
        this.drawScene();
      }
    });
  }

  initWebGL() {
    let gl = this.glCanvas.nativeElement.getContext('webgl');
    if (!gl) {
      gl = this.glCanvas.nativeElement.getContext("experimental-webgl");
    }
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    this.gl = gl;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);

    const vshader = this.createShader(gl.VERTEX_SHADER, this.vshaderSource);
    const fshader = this.createShader(gl.FRAGMENT_SHADER, this.fshaderSource);
    this.createProgram(vshader, fshader);
    gl.useProgram(this.program);

    this.u_MVPMatrix = gl.getUniformLocation(this.program, 'u_MVPMatrix');
    this.u_NormalMatrix = gl.getUniformLocation(this.program, 'u_NormalMatrix');
  }

  drawScene() {
    this.resizeCanvas();
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.drawElements(this.gl.TRIANGLES, this.model.indices.length, this.gl.UNSIGNED_SHORT, 0);

    const now = Date.now();
    const timeDelta = now - this.prevDrawTime;
    this.prevDrawTime = now;

    this.animateModel(this.model, timeDelta);

    window.requestAnimationFrame(() => { this.drawScene(); });
  }

  animateModel(model: Model, timeDelta: number) {
    for (let i = 0; i < 3; i++) {
      if (model.animation.position[i] > 1 && model.animation.movementSpeed[i] > 0) {
        model.animation.movementSpeed[i] *= -1;
      } else if (model.animation.position[i] < -1 && model.animation.movementSpeed[i] < 0) {
        model.animation.movementSpeed[i] *= -1;
      }
    }
    const move_change = vec3.create();
    vec3.scale(move_change, model.animation.movementSpeed, timeDelta/1000);
    vec3.add(model.animation.position, model.animation.position, move_change);

    const rot_change = vec3.create();
    vec3.scale(rot_change, model.animation.rotationSpeed, timeDelta/1000);
    vec3.add(model.animation.angle, model.animation.angle, rot_change);
    
    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, model.animation.position);
    mat4.rotate(modelMatrix, modelMatrix, vec3.length(model.animation.angle), model.animation.angle);
    mat4.scale(modelMatrix, modelMatrix, model.animation.scale);
    const viewMatrix = this.createViewMatrix();
    const projectionMatrix = this.createProjectionMatrix();

    const mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, projectionMatrix, viewMatrix);
    mat4.multiply(mvpMatrix, mvpMatrix, modelMatrix);
    this.gl.uniformMatrix4fv(this.u_MVPMatrix, false, mvpMatrix);

    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    this.gl.uniformMatrix4fv(this.u_NormalMatrix, false, normalMatrix);
  }

  createProgram(vshader: WebGLShader, fshader: WebGLShader): WebGLProgram {
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vshader);
    this.gl.attachShader(this.program, fshader);
    this.gl.linkProgram(this.program);
    const success = this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS);
    if (success) {
      return this.program;
    }

    console.log(this.gl.getProgramInfoLog(this.program));
    this.gl.deleteProgram(this.program);
    return null;
  }

  async loadAssets() {
    this.vshaderSource = await this.httpClient.get('assets/DemoTexture_v.glsl', { responseType: 'text' }).toPromise();
    this.fshaderSource = await this.httpClient.get('assets/DemoTexture_f.glsl', { responseType: 'text' }).toPromise();
    this.jsonModel = await this.httpClient.get('assets/Model_Dennis.json', { responseType: 'json' }).toPromise();
    this.texture = new Image();
    this.texture.onload = () => { this.assetsLoaded.emit('OK'); }
    this.texture.src = 'assets/Dennis.jpg';
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

  initArrayBuffer(data: any, size: number, dataType: number, attributeName: string, program: WebGLProgram) {
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

    const a_attribute = this.gl.getAttribLocation(program, attributeName);
    this.gl.vertexAttribPointer(a_attribute, size, dataType, false, 0, 0);
    this.gl.enableVertexAttribArray(a_attribute);
  }

  initIndexBuffer() {
    const indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.model.indices, this.gl.STATIC_DRAW);
  }

  initTexture() {
    const texture = this.gl.createTexture();
    const u_Sampler = this.gl.getUniformLocation(this.program, 'u_Sampler');

    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.model.texture);
    this.gl.uniform1i(u_Sampler, 0);
  }

  createProjectionMatrix(): mat4 {
    const fieldOfView = (90 * Math.PI)/180;
    const ratio =  this.gl.canvas.clientWidth/this.gl.canvas.clientHeight;
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
    const u_LightDirection = this.gl.getUniformLocation(this.program, 'u_LightDirection');
    const lightDirection = vec3.fromValues(-1.0, 1.0, 2.0);
    vec3.normalize(lightDirection, lightDirection);
    this.gl.uniform3fv(u_LightDirection, lightDirection);

    const u_LightColour = this.gl.getUniformLocation(this.program, 'u_LightColour');
    this.gl.uniform3f(u_LightColour, 0.7, 0.7, 0.7);

    const u_AmbientLight = this.gl.getUniformLocation(this.program, 'u_AmbientLight');
    this.gl.uniform3f(u_AmbientLight, 0.3, 0.3, 0.3);

  }

  createModel() {
    this.model = {
      indices: new Uint16Array([].concat.apply([], this.jsonModel.meshes[0].faces)),
      vertexSize: 3, // XYZ
      vertices: new Float32Array(this.jsonModel.meshes[0].vertices),
      normalSize: 3,
      normals: new Float32Array(this.jsonModel.meshes[0].normals),
      texture: this.texture,
      textureCoords: new Float32Array(this.jsonModel.meshes[0].texturecoords[0]),
      textureCoordSize: 2, // UV
      animation: {
        position: vec3.fromValues(0.0, 0.0, 0.0),
        movementSpeed: vec3.fromValues(0.0, 0.0, 0.0),
        scale: vec3.fromValues(0.03, 0.03, 0.03),
        angle: vec3.fromValues(0.0, 0.0, 0.0),
        rotationSpeed: vec3.fromValues(0.0, 1.0, 0.0)
      }
    };
  }

  @HostListener('window:resize', ['$event'])
  resizeCanvas() {
    if (!this.gl) {
      return;
    }
   
    if (this.gl.canvas.width != this.gl.canvas.clientWidth || this.gl.canvas.height != this.gl.canvas.clientHeight) {
        this.gl.canvas.width  = this.gl.canvas.clientWidth;
        this.gl.canvas.height = this.gl.canvas.clientHeight;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
      }
  }
}

class Model {
  indices: Uint16Array;
  vertices: Float32Array;
  vertexSize: number;
  normals: Float32Array;
  normalSize: number;
  animation: Animation;
  texture: HTMLImageElement;
  textureCoords: Float32Array;
  textureCoordSize: number;
}

class Animation {
  position: vec3;
  movementSpeed: vec3;
  scale: vec3;
  angle: vec3;
  rotationSpeed: vec3;
}