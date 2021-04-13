import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import "./App.css";
import { options, rtc } from "./constants";
import AgoraRTC from "agora-rtc-sdk-ng";

function App() {
  async function handleSubmit(e) {
    try {
      if (channelRef.current.value === "") {
        return console.log("Please Enter Channel Name");
      }

      setJoined(true);

      rtc.client = AgoraRTC.createClient({ mode: "live", codec: "h264" });
      const uid = await rtc.client.join(
        options.appId,
        channelRef.current.value,
        options.token,
        null
      );

      /*rtc.client.init(options.appId, function () {
        console.log("AgoraRTC client initialized");
      }, function (err) {
        console.log("AgoraRTC client init failed", err);
      });*/

      // Create an audio track from the audio captured by a microphone
      rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      // Create a video track from the video captured by a camera
      rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();

      rtc.localVideoTrack.play("local-stream");

      rtc.client.on("user-published", async (user, mediaType) => {
        // Subscribe to a remote user
        await rtc.client.subscribe(user);
        console.log("subscribe success");
        // console.log(user);

        if (mediaType === "video" || mediaType === "all") {
          // Get `RemoteVideoTrack` in the `user` object.
          const remoteVideoTrack = user.videoTrack;
          console.log(remoteVideoTrack);

          // Dynamically create a container in the form of a DIV element for playing the remote video track.
          const PlayerContainer = React.createElement("div", {
            id: user.uid,
            className: "stream",
          });
          ReactDOM.render(
            PlayerContainer,
            document.getElementById("remote-stream")
          );

          user.videoTrack.play(`${user.uid}`);
        }

        if (mediaType === "audio" || mediaType === "all") {
          // Get `RemoteAudioTrack` in the `user` object.
          const remoteAudioTrack = user.audioTrack;
          // Play the audio track. Do not need to pass any DOM element
          remoteAudioTrack.play();
        }
      });

      rtc.client.on("user-unpublished", (user) => {
        // Get the dynamically created DIV container
        const playerContainer = document.getElementById(user.uid);
        console.log(playerContainer);
        // Destroy the container
        playerContainer.remove();
      });

      // Publish the local audio and video tracks to the channel
      await rtc.client.publish([rtc.localAudioTrack, rtc.localVideoTrack]);

      console.log("publish success!");
    } catch (error) {
      console.error(error);
    }
  }

  async function handleLeave() {
    try {
      const localContainer = document.getElementById("local-stream");

      rtc.localAudioTrack.close();
      rtc.localVideoTrack.close();

      setJoined(false);
      localContainer.textContent = "";

      // Traverse all remote users
      rtc.client.remoteUsers.forEach((user) => {
        // Destroy the dynamically created DIV container
        const playerContainer = document.getElementById(user.uid);
        playerContainer && playerContainer.remove();
      });

      // Leave the channel
      await rtc.client.leave();
    } catch (err) {
      console.error(err);
    }
  }
  const [joined, setJoined] = useState(false);
  const channelRef = useRef("");
  const remoteRef = useRef("");
  const leaveRef = useRef("");

  return (
    <>
      <div className="container">
        <input
          type="text"
          ref={channelRef}
          id="channel"
          value={'michigan-live'}
          placeholder="Enter Channel name"
        />
        <input
          type="submit"
          value="Join"
          onClick={handleSubmit}
          disabled={joined ? true : false}
        />
        <input
          type="button"
          ref={leaveRef}
          value="Leave"
          onClick={handleLeave}
          disabled={joined ? false : true}
        />
      </div>
      {joined ? (
        <>
          <div id="local-stream" className="stream local-stream"></div>
          <div
            id="remote-stream"
            ref={remoteRef}
            className="stream remote-stream"
          >rrtrt</div>
        </>
      ) : null}
    </>
  );
}

export default App;
