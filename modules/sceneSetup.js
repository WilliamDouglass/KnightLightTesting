import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let hdrTexture;

export async function initializeScene(scene, renderer) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5; // use 1 for night and .5 for day

  const hdrDay = new URL(
    "../Art/Textures/scythian_tombs_2_4k.hdr",
    import.meta.url
  );
  const hdrNight = new URL(
    "../Art/Textures/moonless_golf_4k.hdr",
    import.meta.url
  );

  try {
    hdrTexture = await loadEnvironment(hdrDay); //Change between day and night
    scene.background = hdrTexture;
    scene.environment = hdrTexture;

    // Additional scene setup or initialization
    // field(scene);
    // loadMesh("../models/LowPolyEnv.glb", scene);
    loadMesh("../models/Grass.glb", scene);
  } catch (error) {
    console.error("Error loading environment:", error);
  }
}

export function loadHDRTexture(hdrTextureURL) {
  return new Promise((resolve, reject) => {
    const loader = new RGBELoader();

    loader.load(
      hdrTextureURL,
      function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}

export function loadEnvironment(hdrTextureURL) {
  return loadHDRTexture(hdrTextureURL);
}

function field(scene) {
  // console.log('Testing');

  const mat = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });
  // // const mat = new THREE.MeshStandardMaterial({color: '#cf1657'});

  // const geometry = new THREE.SphereGeometry(5, 32, 32);
  // const sphere = new THREE.Mesh(geometry, mat);
  // scene.add(sphere);

  // Field setup
  const fieldGeo = new THREE.PlaneGeometry(2000, 2000);
  const fieldMesh = new THREE.Mesh(fieldGeo, mat);
  scene.add(fieldMesh);
  fieldMesh.receiveShadow = true;
  fieldMesh.rotation.x = 0.5 * Math.PI;
  fieldMesh.rotation.y = Math.PI;

  fieldMesh.position.y = -1;
}

function loadMesh(modelPath, scene) {
  const loader = new GLTFLoader();

  loader.load(modelPath, (gltf) => {
    // The model has been loaded
    const customMesh = gltf.scene;
    customMesh.rotation.y = 90 * (Math.PI / 180);
    scene.add(customMesh);
  });
}
