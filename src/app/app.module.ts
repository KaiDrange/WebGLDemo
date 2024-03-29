import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DemoTriangleComponent } from './demo-triangle/demo-triangle.component';
import { DemoColoursComponent } from './demo-colours/demo-colours.component';
import { DemoAnimationComponent } from './demo-animation/demo-animation.component';
import { DemoCubeComponent } from './demo-cube/demo-cube.component';
import { DemoPerspectiveComponent } from './demo-perspective/demo-perspective.component';
import { DemoLightComponent } from './demo-light/demo-light.component';
import { DemoTextureComponent } from './demo-texture/demo-texture.component';
import { DemoMultipleComponent } from './demo-multiple/demo-multiple.component';

@NgModule({
  declarations: [
    AppComponent,
    DemoTriangleComponent,
    DemoColoursComponent,
    DemoAnimationComponent,
    DemoCubeComponent,
    DemoPerspectiveComponent,
    DemoLightComponent,
    DemoTextureComponent,
    DemoMultipleComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
