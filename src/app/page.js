"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Color, Solver } from "../utils/Color";

export default function Home() {
  const [, setTick] = useState(0);
  const [alwaysTouchCorners, setAlwaysTouchCorners] = useState(false);
  const [buttonStyle, setButtonStyle] = useState({ filter: "invert(1)" });
  
  const positionRef = useRef({ x: 100, y: 100 });
  const speedRef = useRef({ x: 5, y: 5 });
  const targetCornerRef = useRef(null);
  const [imageStyle, setImageStyle] = useState({ filter: "invert(1)" });
  const baseSpeed = 5;

  const [screenWidth, setScreenWidth] = useState(910);
  const [screenHeight, setScreenHeight] = useState(995);
  const [imageWidth, setImageWidth] = useState(200);
  const [imageHeight, setImageHeight] = useState(100);

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

  useEffect(() => {
    const updateScreenSize = () => {
      setScreenHeight(window.innerHeight);
      setScreenWidth(window.innerWidth);
    };

    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      let nextPosition = {
        x: positionRef.current.x + speedRef.current.x,
        y: positionRef.current.y + speedRef.current.y
      };

      if (alwaysTouchCorners) {
        // Only check for corner collisions in corner mode
        if (targetCornerRef.current && hasReachedCorner(nextPosition, targetCornerRef.current)) {
          setImageStyle({ filter: getRandomColorFilter() });
          const nextCorner = findNextCorner(targetCornerRef.current);
          targetCornerRef.current = nextCorner;
          speedRef.current = calculateVelocityToCorner(nextPosition, nextCorner);
        }
      } else {
        // Edge bouncing behavior only in edge mode
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

      // Ensure the logo stays within bounds regardless of mode
      nextPosition.x = Math.max(0, Math.min(screenWidth - imageWidth, nextPosition.x));
      nextPosition.y = Math.max(0, Math.min(screenHeight - imageHeight, nextPosition.y));

      positionRef.current = nextPosition;
      setTick(tick => tick + 1);
    }, 20);

    return () => clearInterval(interval);
  }, [screenWidth, screenHeight, alwaysTouchCorners]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-black overflow-hidden">
      <button 
        onClick={toggleCornerMode}
        className="fixed top-4 left-4 z-10 bg-black border-2 px-6 py-3 rounded-lg font-bold transform transition-transform duration-200 hover:scale-105 active:scale-95 shadow-lg"
        style={buttonStyle}
      >
        {alwaysTouchCorners ? "EDGE MODE" : "CORNER MODE"}
      </button>
      
      <div
        className="absolute"
        style={{
          left: `${positionRef.current.x}px`,
          top: `${screenHeight - positionRef.current.y - imageHeight}px`,
          width: imageWidth,
          height: imageHeight,
        }}
      >
        <Image
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