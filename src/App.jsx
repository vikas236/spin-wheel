import React, { useState, useEffect } from "react";
import spin_wheel from "./assets/spin-wheel.png";
import { v4 as uuidv4 } from "uuid";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

function App() {
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("");
  const [decision, setDecision] = useState("pending");
  const [deviceInfo, setDeviceInfo] = useState({ fingerprint: "", uid: "" });
  const [isGameCompleted, setIsGameCompleted] = useState(false);
  const arr = ["no win", "win", "bad", "good", "unlucky", "lucky"];
  const server_dev_url = "http://localhost:3000/";
  const server_prod_url = "https://spinner-server.vercel.app/";
  const server_url = server_prod_url;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fpPromise = FingerprintJS.load();
        const fp = await fpPromise;
        const response = await fp.get();
        const fingerprint = response.visitorId;
        const uid = uuidv4();
        const res = await fetch(`${server_url}check_user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fingerprint: fingerprint,
            uid: uid,
          }),
        });
        const data = await res.json();
        if (data.exists) {
          console.log("Game already completed");
          setIsGameCompleted(true);
        }
      } catch (error) {
        console.error("Error getting device details:", error);
      }
    };
    fetchData();
  }, [decision, server_url]);

  useEffect(() => {
    if (result) {
      const button = document.querySelector(".spin-button");

      if (result === "win") {
        setStatus("You won!");
        setDecision("win");
      } else if (["no win", "bad", "unlucky"].includes(result)) {
        setStatus("Game Over\n No Prizes for You");
        setDecision("loss");
      } else {
        button.style.display = "block";
        setStatus("You Got Lucky\nTry Again");
      }

      getDeviceDetails();
    }
  }, [result]);

  useEffect(() => {
    if (deviceInfo.fingerprint || deviceInfo.uid) {
      const postData = async () => {
        try {
          const res = await fetch(`${server_url}add_user`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fingerprint: deviceInfo.fingerprint,
              uid: deviceInfo.uid,
              status: decision,
            }),
          });
          const data = await res.json();
          console.log("user status updated");
        } catch (error) {
          console.error("Error:", error);
        }
      };
      postData();
    }
  }, [deviceInfo, decision, server_url]);

  function spinWheel(e) {
    e.currentTarget.style.display = "none";

    setStatus("");
    const wheel = document.querySelector("img");

    let previous_angle = wheel.style.transform
      .replace("rotate(", "")
      .replace("deg)", "");
    previous_angle = previous_angle ? parseInt(previous_angle) : 0;

    const random = Math.floor(Math.random() * 360 + 3600 + previous_angle);
    wheel.style.transform = `rotate(${random}deg)`;
    setTimeout(() => {
      getResult(random % 360);
    }, 12500);
  }

  function getResult(angle) {
    let result = arr[Math.floor((angle - 20) / 60)];
    result ? setResult(result) : setResult(arr[5]);
  }

  function getDeviceDetails() {
    const fetchDeviceDetails = async () => {
      try {
        const fpPromise = FingerprintJS.load();
        const fp = await fpPromise;
        const response = await fp.get();
        const fingerprint = response.visitorId;
        const uid = uuidv4();
        setDeviceInfo({
          fingerprint,
          uid,
        });
      } catch (error) {
        console.error("Error getting device details:", error);
      }
    };
    fetchDeviceDetails();
  }

  return (
    <div className="app w-dvw h-dvh flex items-center justify-between">
      {!isGameCompleted ? (
        <div className="flex w-full h-full min-h-dvw flex-col gap-5 pt-10 items-center justify-between">
          <div>
            <img
              src={spin_wheel}
              alt="spin wheel"
              className="w-[calc(100dvw-20px)] transition-all duration-12500 rounded-full"
            />
            <i className="bx bx-right-arrow picker text-[#031926] rotate-[45deg] text-3xl absolute top-[calc(47px)] left-[calc(47px)]"></i>
            {result ? (
              <p className="font-semibold text-xl text-center mt-2">
                {status ? status : ""}
              </p>
            ) : (
              ""
            )}
          </div>
          <div className="relative mb-2">
            <button
              className="absolute w-[calc(100dvw-20px)] h-[100px] bg-[#4285F4] left-0 top-0 text-white active:bg-white transition-all rounded-3xl text-lg"
              onClick={(e) => {
                e.currentTarget.remove();
              }}
            >
              <a
                href="https://search.google.com/local/writereview?placeid=ChIJGXIeuniTyzsRo_AgmP6zxZ0"
                className="absolute w-[calc(100dvw-20px)] h-full bg-[#4285F4] left-0 top-0 text-white active:bg-white transition-all rounded-3xl flex justify-center items-center px-10 "
                target="_blank"
              >
                come back for a spin
              </a>
            </button>
            <button
              className="spin-button w-[calc(100dvw-20px)] h-[100px] px-7 py-1 active:bg-white rounded-3xl bg-[#031926]
           transition-all text-white active:text-[#031926] text-lg cursor-pointer mb-[10px]"
              onClick={spinWheel}
            >
              Spin
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full h-full min-h-dvw flex flex-col gap-5 pt-10 items-center justify-center">
          <h1 className="text-3xl font-semibold text-gray-400">Game Over</h1>
        </div>
      )}
    </div>
  );
}
export default App;
