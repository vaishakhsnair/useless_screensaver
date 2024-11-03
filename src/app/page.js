    "use client";

    import Image from "next/image";
    import { useState, useEffect, useRef } from "react";
    import { Color, Solver } from "../utils/Color";

    export default function Home() {
      const [, setTick] = useState(0);

      const positionRef = useRef({ x: 100, y: 100 });
      const speedRef = useRef({ x: 5, y: 5 });
      const [imageStyle, setImageStyle] = useState({ filter: "invert(1)" });
      const isHitEdge = useRef(false);

      const [screenWidth, setScreenWidth] = useState(600);
      const [screenHeight, setScreenHeight] = useState(600);
      const [imageWidth, setImageWidth] = useState(200);
      const [imageHeight, setImageHeight] = useState(100);

      // Update screen dimensions on load and resize
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
          const newX = positionRef.current.x + speedRef.current.x;
          const newY = positionRef.current.y + speedRef.current.y;

          // Image dimensions
          const logoWidth = imageWidth;
          const logoHeight = imageHeight;
          let isHittingEdge = false;
          // Bounce off edges and reverse direction
          if (newX <= 0 || newX >= screenWidth - logoWidth) {
            speedRef.current.x = -speedRef.current.x;
            isHittingEdge = true;
          }
          if (newY <= 0 || newY >= screenHeight - logoHeight) {
            speedRef.current.y = -speedRef.current.y;
            isHittingEdge = true;
          }

          // Change color on edge hit
          if (isHittingEdge && !isHitEdge.current) {
            const randomColor = () => Math.floor(Math.random() * 256);
            const color = new Color(randomColor(), randomColor(), randomColor());
            const solver = new Solver(color);
            const result = solver.solve();
            const filter = result.filter.split("filter:")[1].split(";")[0];

            console.log(filter)
            setImageStyle({ filter: filter });
            isHitEdge.current = true;
          } else if (!isHittingEdge) {
            isHitEdge.current = false;
          }


          // Update position
          positionRef.current = { x: newX, y: newY };

          // Trigger re-render  
          setTick((tick) => tick + 1);
        }, 20);

        return () => clearInterval(interval);
      }, [screenWidth, screenHeight]);

      return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-black overflow-hidden">
          <div
            className="absolute"
            style={{
              left: `${positionRef.current.x}px`,
              top: `${positionRef.current.y}px`,
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
