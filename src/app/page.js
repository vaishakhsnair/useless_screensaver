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

  // Define corners based on bottom-left origin
  const getCorners = () => ({
    bottomLeft: { x: 0, y: 0 },
    bottomRight: { x: screenWidth - imageWidth, y: 0 },
    topLeft: { x: 0, y: screenHeight - imageHeight },
    topRight: { x: screenWidth - imageWidth, y: screenHeight - imageHeight },
  });

  // Find nearest corner to current position
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

  // Find next corner to target (different from current corner)
  const findNextCorner = (currentCorner) => {
    const corners = getCorners();
    const cornerKeys = Object.keys(corners);
    const currentIndex = cornerKeys.findIndex(key => key === currentCorner.key);
    
    // Move to next corner, wrap around to first if at end
    const nextIndex = (currentIndex + 1) % cornerKeys.length;
    const nextCornerKey = cornerKeys[nextIndex];
    return { ...corners[nextCornerKey], key: nextCornerKey };
  };

  // Calculate velocity to reach target corner
  const calculateVelocityToCorner = (from, to) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return {
      x: (dx / distance) * baseSpeed,
      y: (dy / distance) * baseSpeed
    };
  };

  // Check if we've reached a corner
  const hasReachedCorner = (position, corner) => {
    const threshold = 1; // Distance threshold for considering corner reached
    return Math.abs(position.x - corner.x) < threshold && 
           Math.abs(position.y - corner.y) < threshold;
  };

  // Function to change color and get filter
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
      // When enabling corner mode, find and target nearest corner
      const nearestCorner = findNearestCorner(positionRef.current);
      targetCornerRef.current = nearestCorner;
      const velocity = calculateVelocityToCorner(positionRef.current, nearestCorner);
      speedRef.current = velocity;
    } else {
      // When disabling, revert to normal bouncing behavior
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
        // Corner-to-corner movement
        if (targetCornerRef.current && hasReachedCorner(nextPosition, targetCornerRef.current)) {
          // Reached current target corner, set next corner as target
          setImageStyle({ filter: getRandomColorFilter() });
          const nextCorner = findNextCorner(targetCornerRef.current);
          targetCornerRef.current = nextCorner;
          speedRef.current = calculateVelocityToCorner(nextPosition, nextCorner);
        }
      } else {
        // Normal bouncing behavior
        let colorChange = false;
        
        // Check for hitting edges and reverse direction
        if (nextPosition.x <= 0) {
          speedRef.current.x = Math.abs(speedRef.current.x); // Move right
          nextPosition.x = 0; // Adjust position to stay within bounds
          colorChange = true;
        } else if (nextPosition.x >= screenWidth - imageWidth) {
          speedRef.current.x = -Math.abs(speedRef.current.x); // Move left
          nextPosition.x = screenWidth - imageWidth; // Adjust position to stay within bounds
          colorChange = true;
        }

        if (nextPosition.y <= 0) {
          speedRef.current.y = Math.abs(speedRef.current.y); // Move down
          nextPosition.y = 0; // Adjust position to stay within bounds
          colorChange = true;
        } else if (nextPosition.y >= screenHeight - imageHeight) {
          speedRef.current.y = -Math.abs(speedRef.current.y); // Move up
          nextPosition.y = screenHeight - imageHeight; // Adjust position to stay within bounds
          colorChange = true;
        }

        if (colorChange) {
          setImageStyle({ filter: getRandomColorFilter() });
        }

        // Update the position reference
        positionRef.current = nextPosition;
      }

      // Update the position reference and trigger a re-render
      positionRef.current = nextPosition;
      setTick(tick => tick + 1);
    }, 20);

    return () => clearInterval(interval);
  }, [screenWidth, screenHeight, alwaysTouchCorners]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-black overflow-hidden">
      <button 
        onClick={toggleCornerMode}
        className="fixed top-4 left-4 z-10 bg-white px-6 py-3 rounded-lg font-bold transform transition-transform duration-200 hover:scale-105 active:scale-95 shadow-lg"
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
