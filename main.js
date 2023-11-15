import * as THREE from 'three';

// Uncomment when loading a GLTF file for the drone, and remember to add const loader = new GLTFLoader();
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import renderGUI from './modules/gui';
import helpers from './modules/helpers';
import controls from './modules/controls';
import {show_animation, initializeTrajectory} from './modules/show_animation';
import {updateDroneLighting} from './modules/show_lighting'
import ParseSkyc from './modules/parse';

// Scene initialization
import { initializeScene } from './modules/sceneSetup';
// import { getHDRTexture } from './modules/sceneSetup';

// Keyboard controls
import { moveState, initKeyboardControls } from './modules/keyboardControls';

// Top left statistics
import Stats from 'stats.js';

// Initialize statistics
const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';
document.body.appendChild(stats.domElement);

let showState = {
	playing: false
};

import { Stopwatch } from './modules/stopwatch';

let stopwatch = new Stopwatch();

let stopConditionTime = 0;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 5000 );

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
// renderer.setClearColor('red');

//#region Background hdri
//! 

    // const light = new THREE.AmbientLight(0x333333, 4);
    // const Dlight = new THREE.DirectionalLight(0xFFFFFF, 1);
    // Dlight.position.set(200, 200, 200);
    // Dlight.castShadow = true;
    // Dlight.shadow.camera.top = 50;
    // Dlight.shadow.camera.bottom = -50;
    // Dlight.shadow.camera.right = 50;
    // Dlight.shadow.camera.left = -50;
    // scene.add( light );
    // scene.add(Dlight);
//#endregion

//Drone Mesh
const sphere = new THREE.SphereGeometry(1, 15, 10);
// const sphere = new THREE.BoxGeometry(1,1,1);
// const material = new THREE.MeshStandardMaterial({
//     metalness: 1, // Adjust these values based on your scene and desired appearance
//     roughness: 0.5,
//     // envMap: hdrTexture, // Use the loaded HDR texture as the environment map
//     });
const material = new THREE.MeshStandardMaterial({
    color: "red",
    // metalness: 1, // Adjust these values based on your scene and desired appearance
    // roughness: 0.5,
    // envMap: hdrTexture, // Use the loaded HDR texture as the environment map
    });

const drone = new THREE.Mesh(sphere, material);
drone.castShadow = true;

// Initialize the scene
initializeScene(scene,renderer);

// List of files
let fileList = [];

let currentFile = null;

let drone_list;

// For space bar functionality
let guiObjects;
let playController;

// Camera moving speed
let guiOptions;



fetch('./sample_data/fileList.json')
    .then(response => response.json())
    .then(data => {
        fileList = data.files;
        currentFile = fileList[0];
        guiObjects = renderGUI(drone, showState, fileList, setCurrentFile, stopwatch);
        playController = guiObjects.playController;
        guiOptions = guiObjects.options;
        
        const result = ParseSkyc(`./sample_data/${currentFile}`, scene, drone);
        drone_list = result.drones;
        stopConditionTime = result.maxLandingTime * 1000; // Convert to milliseconds

        return drone_list;
    })
    .catch(error => console.error("File list error:", error));

function setCurrentFile(filename) {
    currentFile = filename;

    // 1. Reset the stopwatch
    if (stopwatch) {
        stopwatch.stop();
        stopwatch.reset();
        guiOptions.timerOptions.time = "00:00.000";
    }

    // 2. Remove old drones from the scene
    drone_list.forEach(oldDrone => {
        scene.remove(oldDrone);
    });

    const result = ParseSkyc(`./sample_data/${currentFile}`, scene, drone);
    drone_list = result.drones;
    stopConditionTime = result.maxLandingTime * 1000; // Convert to milliseconds

    if (stopwatch && showState.playing) {
        stopwatch.start();
    }
}

function animate() {
	requestAnimationFrame( animate );
	
	// Moving the camera
    if (moveState.forward) {
        camera.translateZ(-guiOptions.speed);
    }
    if (moveState.backward) {
        camera.translateZ(guiOptions.speed);
    }
    if (moveState.left) {
        camera.translateX(-guiOptions.speed);
    }
    if (moveState.right) {
        camera.translateX(guiOptions.speed);
    }
	if (moveState.up) {
        camera.translateY(guiOptions.speed);
    }
    if (moveState.down) {
        camera.translateY(-guiOptions.speed);
    }

	// Pause and Play
	if (showState.playing) {
        show_animation(drone_list, stopwatch, stopConditionTime);
        updateDroneLighting(drone_list, stopwatch);
        let time = stopwatch.getTime();
        let minutes = Math.floor(time / 60000);
        let seconds = Math.floor((time % 60000) / 1000);
        let milliseconds = time % 1000;
        let formattedTime = (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds + ":" + ("00" + milliseconds).slice(-3);
        guiOptions.timerOptions.time = formattedTime;
	}

	// Update statistics
	stats.update();

	renderer.render( scene, camera );
}

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}

// Add an event listener for the space bar keydown event
document.addEventListener('keydown', (event) => {
	// Check if any GUI control is focused
	if (event.code === "Space" && !isGUIFocused()) {  // Check if the pressed key is the space bar
		showState.playing = !showState.playing;  // Toggle the playing state
		playController.setValue(showState.playing);  // Update the checkbox
        if (showState.playing) {
            stopwatch.start();
        } else {
            stopwatch.stop();
        }
	}
});

function isGUIFocused() {
    return document.activeElement && document.activeElement.classList.contains('dg');
}

//Displays wireframes
helpers(scene);

//Camera Movement and input
controls(camera, renderer);

// Initialize keyboard controls
initKeyboardControls(); //? idk what this does

animate(); //Everything 