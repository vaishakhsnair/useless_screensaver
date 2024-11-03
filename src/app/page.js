"use client";

import { useEffect, useState, useRef } from "react";
import * as faceapi from 'face-api.js';
import Image from "next/image";
import { Color, Solver } from "../utils/Color";

export default function Home() {
  const [tick, setTick] = useState(0);
  const [alwaysTouchCorners, setAlwaysTouchCorners] = useState(false);
  const [buttonStyle, setButtonStyle] = useState({ filter: "invert(1)" });
  
  const positionRef = useRef({ x: 100, y: 100 });
  const speedRef = useRef({ x: 5, y: 5 });
  const targetCornerRef = useRef(null);
  const cooldownRef = useRef(Date.now());
  const [imageStyle, setImageStyle] = useState({ filter: "invert(1)" });
  const baseSpeed = 5;

  const [screenWidth, setScreenWidth] = useState(910);
  const [screenHeight, setScreenHeight] = useState(995);
  const [imageWidth, setImageWidth] = useState(200);
  const [imageHeight, setImageHeight] = useState(100);

  // Face Detection States
  const [captureVideo, setCaptureVideo] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [face,setHasFace] = useState(false)
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const videoContainerRef = useRef(null);
  const videoHeight = 480;
  const videoWidth = 640;


  useEffect(() => {
    if (!face && !alwaysTouchCorners) {
      const nearestCorner = findNearestCorner(positionRef.current);
      targetCornerRef.current = nearestCorner;
      speedRef.current = calculateVelocityToCorner(positionRef.current, nearestCorner);
      setAlwaysTouchCorners(true); // Switch to corner-only mode if no face detected
      setButtonStyle({ filter: getRandomColorFilter() });
    } else if (face && alwaysTouchCorners) {
      speedRef.current = { x: baseSpeed, y: baseSpeed };

      setAlwaysTouchCorners(false); // Reset to normal mode if a face is detected
    }
  }, [face, alwaysTouchCorners]);



  
  // DVD Logo Functions
  const getCorners = () => ({
    bottomLeft: { x: 0, y: 0 },
    bottomRight: { x: screenWidth - imageWidth, y: 0 },
    topLeft: { x: 0, y: screenHeight - imageHeight },
    topRight: { x: screenWidth - imageWidth, y: screenHeight - imageHeight },
  });

  const findNearestCorner = (position) => {
    const corners = getCorners();
    let nearest = null;
    let minDistance = Infinity;

    Object.entries(corners).forEach(([key, corner]) => {
      const dx = corner.x - position.x;
      const dy = corner.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = { ...corner, key };
      }
    });

    return nearest;
  };

  const findNextCorner = (currentCorner) => {
    const corners = getCorners();
    const cornerKeys = Object.keys(corners);
    const currentIndex = cornerKeys.findIndex(key => key === currentCorner.key);
    const nextIndex = (currentIndex + 1) % cornerKeys.length;
    const nextCornerKey = cornerKeys[nextIndex];
    return { ...corners[nextCornerKey], key: nextCornerKey };
  };

  const calculateVelocityToCorner = (from, to) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return {
      x: (dx / distance) * baseSpeed,
      y: (dy / distance) * baseSpeed
    };
  };

  const hasReachedCorner = (position, corner) => {
    const threshold = 1;
    return Math.abs(position.x - corner.x) < threshold && 
           Math.abs(position.y - corner.y) < threshold;
  };

  const getRandomColorFilter = () => {
    const randomColor = () => Math.floor(Math.random() * 256);
    const color = new Color(randomColor(), randomColor(), randomColor());
    const solver = new Solver(color);
    const result = solver.solve();
    return result.filter.split("filter:")[1].split(";")[0];
  };

  const toggleCornerMode = () => {
    const now = Date.now();
    const cooldownPeriod = 2000; // 2 seconds



    if (now - cooldownRef.current < cooldownPeriod) {
      return;
    }
    
    

    cooldownRef.current = now;

    const newMode = !alwaysTouchCorners;
    setAlwaysTouchCorners(newMode);
    setButtonStyle({ filter: getRandomColorFilter() });

    if (newMode) {
      const nearestCorner = findNearestCorner(positionRef.current);
      targetCornerRef.current = nearestCorner;
      speedRef.current = calculateVelocityToCorner(positionRef.current, nearestCorner);
    } else {
      speedRef.current = { x: baseSpeed, y: baseSpeed };
    }
  };

  // Screen size effect
  useEffect(() => {
    const updateScreenSize = () => {
      setScreenHeight(window.innerHeight);
      setScreenWidth(window.innerWidth);
    };

    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  // DVD Logo animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      let nextPosition = {
        x: positionRef.current.x + speedRef.current.x,
        y: positionRef.current.y + speedRef.current.y
      };

      if (alwaysTouchCorners) {
        if (nextPosition.x <= 0 || nextPosition.x >= screenWidth - imageWidth) {
          speedRef.current.x = -speedRef.current.x;
          nextPosition.x = Math.max(0, Math.min(screenWidth - imageWidth, nextPosition.x));
        }

        if (nextPosition.y <= 0 || nextPosition.y >= screenHeight - imageHeight) {
          speedRef.current.y = -speedRef.current.y;
          nextPosition.y = Math.max(0, Math.min(screenHeight - imageHeight, nextPosition.y));
        }

        if (targetCornerRef.current && hasReachedCorner(nextPosition, targetCornerRef.current)) {
          setImageStyle({ filter: getRandomColorFilter() });
          const nextCorner = findNextCorner(targetCornerRef.current);
          targetCornerRef.current = nextCorner;
          speedRef.current = calculateVelocityToCorner(nextPosition, nextCorner);
        }
      } else {
        let colorChange = false;
        
        if (nextPosition.x <= 0 || nextPosition.x >= screenWidth - imageWidth) {
          speedRef.current.x = -speedRef.current.x;
          colorChange = true;
        }

        if (nextPosition.y <= 0 || nextPosition.y >= screenHeight - imageHeight) {
          speedRef.current.y = -speedRef.current.y;
          colorChange = true;
        }

        if (colorChange) {
          setImageStyle({ filter: getRandomColorFilter() });
        }
      }

      nextPosition.x = Math.max(0, Math.min(screenWidth - imageWidth, nextPosition.x));
      nextPosition.y = Math.max(0, Math.min(screenHeight - imageHeight, nextPosition.y));

      positionRef.current = nextPosition;
      setTick(tick => tick + 1);
    }, 20);

    return () => clearInterval(interval);
  }, [screenWidth, screenHeight, alwaysTouchCorners]);

  // Face Detection Functions
    useEffect(() => {
      const loadModels = async () => {
        const MODEL_URL = '/';
        
        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
  
          ]);
          
          setModelsLoaded(true);
          console.log('Face detection models loaded successfully');
        } catch (error) {
          console.error('Error loading face detection models:', error);
        }
      };

      loadModels();
    }, []);


      useEffect(() => {
        if (captureVideo) {
          startVideo();
        }
      }, [captureVideo]);
      



    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: videoWidth, height: videoHeight }
        });
        let video = videoRef.current;
        console.log("VideoRef: ", videoRef.current);
        if (video) {
          video.srcObject = stream;
          console.log("Video stream started successfully");
        }
        setCaptureVideo(true);
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    };



  const handleVideoOnPlay = () => {
    const detectFaces = async () => {
      if (videoRef.current) {
        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 160,
          scoreThreshold: 0.3
        });
  
        try {
          const detections = await faceapi.detectAllFaces(
            videoRef.current,
            options
          );
  
          setHasFace(detections.length > 0);
          
          // Log the number of faces detected
          console.log(`Number of faces detected: ${detections.length}`);
          
        } catch (error) {
          console.error('Face detection error:', error);
        }
      }
    };
  
    // Set interval to detect faces and keep the camera active
    const interval = setInterval(detectFaces, 1000);
  
    return () => clearInterval(interval);
  };
    

  const closeWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setCaptureVideo(false);
    setHasFace(false);
  };
  
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-black overflow-hidden">
      <button 
        onClick={toggleCornerMode}
        className="fixed top-4 left-4 z-10 bg-black border-2 px-6 py-3 rounded-lg font-bold transform transition-transform duration-200 hover:scale-105 active:scale-95 shadow-lg"
      >
        {!alwaysTouchCorners ? "EDGE MODE" : "CORNER MODE"}
      </button>

      <div className="fixed top-4 right-4 z-10">
        {captureVideo && modelsLoaded ? (
          <button 
            onClick={closeWebcam}
            className="bg-black border-2 px-6 py-3 rounded-lg font-bold transform transition-transform duration-200 hover:scale-105 active:scale-95 shadow-lg"
          >
            Close Webcam
          </button>
        ) : (
          <button 
          onClick={() => setCaptureVideo(true)}
          className="bg-black border-2 px-6 py-3 rounded-lg font-bold transform transition-transform duration-200 hover:scale-105 active:scale-95 shadow-lg"
        >
          Open Webcam
        </button>
        
        )}
      </div>

      <div 
        className="relative w-full flex justify-center items-center"
        style={{ minHeight: videoHeight }}
      >
        {! modelsLoaded ? (
         
          <div className="text-white">Loading face detection model...</div>
        ): ""}

        {
          !videoRef.current ? (
            <div className="text-white">Webcam is off</div>
          ) : ( ""
          )
        }
      </div>

      <video
          key={captureVideo ? "active" : "inactive"}
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onPlay={handleVideoOnPlay}
          width={videoWidth}
          height={videoHeight}
          className="rounded-lg fixed bottom-0 right-0 w-96 h-64"
          />


<div className="text-2xl font-bold text-green-500 fixed inset-0 flex items-center justify-center">
  {
    !alwaysTouchCorners 
      ? "Eyes on me? NO CORNERS FOR YOU ;)" 
      : "No eyes on me?  Time for the corners !!!"
  }
</div>


    

      <div
        className="absolute"
        style={{
          left: `${positionRef.current.x}px`,
          top: `${screenHeight - positionRef.current.y - imageHeight}px`,
          width: imageWidth,
          height: imageHeight,
        }}
      >


        <img
          src="/dvd_logo.png"
          alt="DVD Logo"
          width={imageWidth}
          height={imageHeight}
          style={imageStyle}
        />
      </div>
    </div>
  );
}