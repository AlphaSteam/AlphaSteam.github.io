
import * as THREE from 'three';

import Stats from 'three/examples/jsm/libs/stats.module.js';

import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Vector2, WebGLMultisampleRenderTarget } from 'three';
import jQuery from "jquery";
window.$ = window.jQuery = jQuery;

var stats = new Stats();
document.body.appendChild(stats.dom);

var lastTime = (new Date()).getTime();
var controls = new function () {
    this.Speed = 0.1;
    this.Scale = 3.0;
    this.dotSize=1.0;
    this.Draw_isolines = true;
    this.Draw_cell_center = true;
    this.Draw_grid = false;

    this.Intensity_control_x = 0.19;
    this.Intensity_control_y = 0.15;

    this.Aura_color=[1,1,1];
    this.Aura_intensity = -1.0;

    this.Red_x = 0.7;
    this.Red_y = 0.7;
    
    this.Green_x = 0.09; 
    this.Green_y = 0.8; 

    this.Blue_x = 0.07; 
    this.Blue_y = 0.8; 

    this.Minimum_distance = 2.0;
    
}
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(0, 0);
var interpoint = new THREE.Vector2(0, 0);
var interpoint2 = new THREE.Vector2(0, 0);
function onMouseMove(event) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    //console.log(interpoint2);
}

var DEMO = {
    ms_Renderer: null,
    ms_Camera: null,
    ms_Scene: null,
    ms_Controls: null,
    raycaster: null,
    mouse: null,
    uniforms: null,
    Initialize: function () {

        this.ms_Renderer = new THREE.WebGLRenderer(
            {
                //alpha: false,
                antialias: true,
                depth:true,
                logarithmicDepthBuffer: true,
                powerPreference: "high-performance",
                //precision:'highp',
                //premultipliedAlpha: true


            }
        );
        this.ms_Renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.ms_Renderer.domElement);

        this.ms_Scene = new THREE.Scene();
        this.ms_Scene.name = 'Viewer';

        this.ms_Camera = new THREE.PerspectiveCamera(55.0, window.innerWidth / window.innerHeight, 0.5, 300000);
        this.ms_Camera.position.set(4, 4, 4);
        this.ms_Camera.lookAt(0, 0, 0);
        this.ms_Scene.add(this.ms_Camera);
        // Initialize Orbit control
        this.ms_Controls = new OrbitControls(this.ms_Camera, this.ms_Renderer.domElement);
        this.ms_Controls.userPan = false;
        this.ms_Controls.userPanSpeed = 0.0;
        this.ms_Controls.minDistance = 0;
        this.ms_Controls.maxDistance = 2000.0;
        this.ms_Controls.minPolarAngle = 0;
        this.ms_Controls.maxPolarAngle = Math.PI * 0.495;

        var gsize = 512;
        var res = 1024;
        var gres = res / 2;
        var origx = - gsize / 2;
        var origz = - gsize / 2;
        var size = 0.75;
        var geometry2 = new THREE.BoxBufferGeometry(0.75,0.75,0.75);
        // geometry
        var width = 4;  // width of plane in world units
        var height = 4; // height of plane in world units
        var size = 1;    // texture block size in world units

        var w = width / size;
        var h = height / size;
        var geometry = new THREE.PlaneGeometry( width, height, 1, 1 );

        var uvs = geometry.faceVertexUvs[ 0 ];
        uvs[ 0 ][ 0 ].set( 0, h );
        uvs[ 0 ][ 1 ].set( 0, 0 );
        uvs[ 0 ][ 2 ].set( w, h );
        uvs[ 1 ][ 0 ].set( 0, 0 );
        uvs[ 1 ][ 1 ].set( w, 0 );
        uvs[ 1 ][ 2 ].set( w, h );  
        
        geometry.uvsNeedUpdate = true;
        this.uniforms = {

            scale: { value:controls.Scale },
            u_mouse: { value: new THREE.Vector2(interpoint2.x, interpoint2.z) },
            dotSize:{value:controls.dotSize},
            u_time: { value: 0},
            showIso:{value: controls.Draw_isolines},
            showCenter:{value: controls.Draw_cell_center},
            showGrid: {value: controls.Draw_grid},
            minimumDist: {value: controls.Minimum_distance},
            auraColor: {value: new THREE.Vector3(controls.Aura_color[0]/255,controls.Aura_color[1]/255,controls.Aura_color[2]/255)},
            auraIntensity:{value: controls.intensity},
            rColor:{value: new THREE.Vector2(controls.Red_x,controls.Red_y)},
            gColor:{value: new THREE.Vector2(controls.Green_x,controls.Green_y)},
            bColor:{value: new THREE.Vector2(controls.Blue_x,controls.Blue_y)},
            IntensityControl: {value: new THREE.Vector2(controls.Intensity_control_x,controls.Intensity_control_y)}


        }
 
        var material = new THREE.ShaderMaterial({
            vertexShader: ` 
            #ifdef GL_FRAGMENT_PRECISION_HIGH
            precision highp float;
            #else
            precision mediump float;
            #endif
            precision mediump int;
            
            varying vec2 vUv;
            varying vec3 vnormal;
            varying vec3 vposition;
			void main()
			{
                
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                gl_Position = projectionMatrix * mvPosition;
                vUv = uv;
                vnormal = normal;
                vposition = position;
			}
                    `,
            side: THREE.DoubleSide,
            uniforms: this.uniforms,

            fragmentShader: `
#ifdef GL_ES
precision mediump float;
#endif

uniform float scale;
uniform vec2 u_mouse;
uniform float u_time;
uniform float dotSize;

uniform bool showIso;
uniform bool showCenter;
uniform bool showGrid;

uniform float minimumDist;

uniform vec3 auraColor;
uniform float auraIntensity;

uniform vec2 rColor;
uniform vec2 gColor;
uniform vec2 bColor;

uniform vec2 IntensityControl;

varying vec2 vUv;
varying vec3 vnormal;
varying vec3 vposition;

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

void main() {
    vec2 st = vUv;
    vec2 st2 = vUv;
    
    vec3 pos = vposition;
    vec3 normal = vnormal;
    
    vec3 color = vec3(.0);
    st *= scale ;
    

    // Tile the space
    vec2 i_st = floor(st);
    vec2 f_st = fract(st);

    float m_dist = minimumDist;  // minimum distance
    vec2 m_point;        // minimum point
	vec2 point2 =u_mouse;
    for (int j=-1; j<=1; j++ ) {
        for (int i=-1; i<=1; i++ ) {
            vec2 neighbor = vec2(float(i),float(j));
            vec2 point = random2(i_st + neighbor);
            point = 0.5 + 0.5*sin(u_time + 6.2831*point);
            vec2 diff = neighbor + point - f_st;
            float dist = length(diff);

            if( dist < m_dist ) {
                m_dist = dist;
                m_point = point;
            }
        }
    }	
    float dist = distance(st2, point2);
    if ( dist < m_dist ) {
        // Keep the closer distance
        m_dist = dist;
    
        // Kepp the position of the closer point
        m_point = point2;
    }
	vec3 aura = auraColor*m_dist*auraIntensity;
    color+=aura;
    color.r += dot(m_point,rColor);
    color.g += dot(m_point,gColor);
    color.b += dot(m_point,bColor);
    color += dot(m_point,IntensityControl);
	
    

    // Show isolines
    if(showIso){
        color -= abs(sin(40.0*m_dist))*0.07;
    }
    

    // Draw cell center
    if(showCenter)
    color += 1.-step(.05, m_dist);

    // Draw grid
    if(showGrid)
    color.r += step(.98, f_st.x) + step(.98, f_st.y);
    
    gl_FragColor = vec4(color,1.0);
}
            `,



        });
        
        var plane = new THREE.Mesh(geometry, material);
        plane.position.x = 0;
        plane.position.y = 0;
        this.ms_Scene.add(plane);
        
    
        var gui = new GUI();
        var redf = gui.addFolder('Red');
        redf.add(controls,'Red_x',0,1);
        redf.add(controls,'Red_y',0,1);

        var greenf = gui.addFolder('Green');
        greenf.add(controls,'Green_x',0,1);
        greenf.add(controls,'Green_y',0,1);

        var bluef = gui.addFolder('Blue');
        bluef.add(controls,'Blue_x',0,1);
        bluef.add(controls,'Blue_y',0,1);

        var intensityf = gui.addFolder('Intensity controller');
        intensityf.add(controls,'Intensity_control_x',-1,1);
        intensityf.add(controls,'Intensity_control_y',-1,1);


        gui.addColor(controls,'Aura_color');
        gui.add(controls,'Aura_intensity',-2,2);

        gui.add(controls, 'Speed', 0, 0.25);
        gui.add(controls, 'Scale',0.5,20);
        gui.add(controls,'Minimum_distance',0.1,2);
        //gui.add(controls, 'dotSize', 0, 1.0);
        

        gui.add(controls,'Draw_cell_center');
        gui.add(controls,'Draw_isolines');
        gui.add(controls,'Draw_grid');
        
        
    },

    Display: function () {

        this.ms_Renderer.render(this.ms_Scene, this.ms_Camera);

    },

    Update: function () {

        var currentTime = new Date().getTime()*0.001;
        var delta = lastTime-currentTime;
        //console.log(interpoint);
        lastTime = currentTime;
        this.uniforms.scale.value = controls.Scale;
        this.uniforms.u_time.value +=controls.Speed;
        this.uniforms.u_mouse.value = new Vector2(interpoint.x, interpoint.y);
        this.uniforms.dotSize.value =controls.dotSize;
        this.uniforms.showIso.value = controls.Draw_isolines;
        this.uniforms.showCenter.value= controls.Draw_cell_center;
        this.uniforms.showGrid.value= controls.Draw_grid;
        this.uniforms.minimumDist.value = controls.Minimum_distance;
        this.uniforms.auraColor.value = new THREE.Vector3(controls.Aura_color[0]/255,controls.Aura_color[1]/255,controls.Aura_color[2]/255);
        this.uniforms.auraIntensity.value = controls.Aura_intensity;
        this.uniforms.rColor.value = new THREE.Vector2(controls.Red_x,controls.Red_y);
        this.uniforms.gColor.value = new THREE.Vector2(controls.Green_x,controls.Green_y);
        this.uniforms.bColor.value = new THREE.Vector2(controls.Blue_x,controls.Blue_y);
        this.uniforms.IntensityControl.value = new THREE.Vector2(controls.Intensity_control_x,controls.Intensity_control_y);
        
        this.Display();

    },

    Resize: function (inWidth, inHeight) {

        this.ms_Camera.aspect = inWidth / inHeight;
        this.ms_Camera.updateProjectionMatrix();
        this.ms_Renderer.setSize(inWidth, inHeight);
        this.Display();

    },


};

DEMO.Initialize();

window.addEventListener('resize', function () {

    DEMO.Resize(window.innerWidth, window.innerHeight);


});
window.addEventListener('mousemove', onMouseMove, false);

DEMO.Resize(window.innerWidth, window.innerHeight);

var render = function () {


    DEMO.Update();
    raycaster.setFromCamera(mouse, DEMO.ms_Camera);
    var intersects = raycaster.intersectObjects(DEMO.ms_Scene.children);
    if (intersects != undefined && intersects != null) {

        if (intersects.length != 0) {
            //console.log(intersects[0]);
            interpoint = intersects[0].uv;
            //console.log(interpoint.x);

        }


    }




    stats.update();

    requestAnimationFrame(render);
    //window.requestAnimationFrame(render);




};

render();
