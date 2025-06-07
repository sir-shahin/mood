import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";

function App() {
  const videoRef = useRef(null);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const [mood, setMood] = useState("");

  useEffect(() => {
    // Camera and model initialization
    const startCamera = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("./models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("./models");
        await faceapi.nets.faceExpressionNet.loadFromUri("./models");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCameraAccess(true);
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };
    startCamera();
  }, []);

  // Separate effect for face detection
  useEffect(() => {
    let mounted = true;

    const detectFaces = async () => {
      if (!mounted) return;

      try {
        // 1. Verify video element is ready
        if (!videoRef.current || videoRef.current.readyState < 2) {
          requestAnimationFrame(detectFaces);
          return;
        }

        // 3. Actual detection
        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        if (detections.length > 0) {
          if (detections[0].expressions.sad >= 0.5) setMood("ناراحت");
          else if (detections[0].expressions.happy >= 0.5) setMood("خوشحال");
          else setMood("");
        }
      } catch (err) {
        console.error("Full detection error:", err);
      }

      if (mounted) requestAnimationFrame(detectFaces);
    };

    if (hasCameraAccess) {
      console.log("Starting detection...");
      detectFaces();
    }

    return () => {
      mounted = false;
    };
  }, [hasCameraAccess]);

  return (
    <div style={{ textAlign: "center" }}>
      <h1>تشخیص خوشحالی و غم</h1>
      <div
        style={{
          margin: "20px",
          maxWidth: 800,
          justifySelf: "center",
          display: "flex",
        }}
      >
        <video ref={videoRef} autoPlay muted width="100%" height="auto" />
      </div>
      {!hasCameraAccess && <p>Waiting for camera access...</p>}
      <h2>{mood}</h2>
    </div>
  );
}

export default App;
