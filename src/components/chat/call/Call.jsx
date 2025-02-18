import React, { useState, useEffect } from 'react';
import Ringing from './Ringing';
import Header from './Header';
import CallArea from './CallArea';
import CallActions from './CallActions';
import Draggable from 'react-draggable';

const Call = ({
	call,
	setCall,

	myVideo,
	stream,
	userVideo,
	answerCall,
	isSmallScreen,
	setShow,
	callNotRespond,
	toggleAudioTrack,
	toggleVideoTrack,
	endCall,
	handlePictureInPicture,
	callRejected,
	totalSecInCall,
	setTotalSecInCall,
	togglePictureInPic,
	setTogglePictureInPic,
}) => {
	const [showActions, setShowActions] = useState(false);
	const { gettingCall, name, callAccepted, callEnded } = call;
	const [toggleAudio, setToggleAudio] = useState(false);
	const [toggleVideo, setToggleVideo] = useState(false);

	// Debugging logs
	useEffect(() => {
		console.log("Component mounted: Call");
		console.log("Call state:", call);
		console.log("Stream available:", !!stream);
	}, []);

	useEffect(() => {
		console.log("Call state changed:", call);
	}, [call]);

	useEffect(() => {
		console.log("Audio track toggled:", toggleAudio);
	}, [toggleAudio]);

	useEffect(() => {
		console.log("Video track toggled:", toggleVideo);
	}, [toggleVideo]);

	// Check if the microphone and video stream are working
	useEffect(() => {
		if (stream) {
			console.log("Stream tracks:", stream.getTracks());

			const audioTrack = stream.getAudioTracks()[0];
			const videoTrack = stream.getVideoTracks()[0];

			if (audioTrack) {
				console.log("Audio track enabled:", audioTrack.enabled);
			} else {
				console.log("No audio track found");
			}

			if (videoTrack) {
				console.log("Video track enabled:", videoTrack.enabled);
			} else {
				console.log("No video track found");
			}
		} else {
			console.log("No stream detected");
		}
	}, [stream]);

	return (
		<div>
			<Draggable disabled={isSmallScreen}>
				<div
					className={`fixed top-0 left-0 sm:top-16 z-10 sm:left-1/3 
					-translate-x-1/2 -translate-y-1/2 h-full w-full sm:w-[350px] 
					sm:h-[550px] rounded-2xl overflow-hidden callbg shadow-2xl  
					${gettingCall && !callAccepted ? 'hidden' : ''}`}
				>
					{/* Container */}
					<div
						onMouseOver={() => setShowActions(true)}
						onMouseLeave={() => setShowActions(false)}
						onDoubleClick={() => setShowActions(false)}
					>
						<div>
							{/* Header */}
							<Header />
							{/* Call Area */}
							<CallArea
								name={name}
								callAccepted={callAccepted}
								setTotalSecInCall={setTotalSecInCall}
								totalSecInCall={totalSecInCall}
								callEnded={callEnded}
							/>
							{/* Call Actions */}
							{showActions && (
								<CallActions
									toggleAudioTrack={() => {
										console.log("Toggling audio");
										toggleAudioTrack();
										setToggleAudio(!toggleAudio);
									}}
									toggleVideoTrack={() => {
										console.log("Toggling video");
										toggleVideoTrack();
										setToggleVideo(!toggleVideo);
									}}
									toggleAudio={toggleAudio}
									setToggleAudio={setToggleAudio}
									toggleVideo={toggleVideo}
									setToggleVideo={setToggleVideo}
									setTogglePictureInPic={setTogglePictureInPic}
									togglePictureInPic={togglePictureInPic}
									endCall={() => {
										console.log("Ending call");
										endCall();
									}}
									handlePictureInPicture={handlePictureInPicture}
								/>
							)}
						</div>

						{/* Video Streams */}
						<div>
							{/* User Video */}
							<div>
							<video
						ref={userVideo}
						playsInline
						autoPlay
						muted={false} // Ensure this is false for incoming audio
						className="largeVideoCall"
					/>

							</div>

							{/* My Video */}
							<div>
								<video
									ref={myVideo}
									playsInline
									muted
									autoPlay
									className={`smallVideoCall ${
										showActions ? 'moveVideoCall' : ''
									}`}
									onLoadedMetadata={() => console.log("My video loaded")}
								></video>
							</div>
						</div>
					</div>
				</div>
			</Draggable>

			{gettingCall && !callAccepted ? (
				<Ringing
					answerCall={answerCall}
					call={call}
					setCall={setCall}
					callAccepted={callAccepted}
					setShow={setShow}
					callNotRespond={callNotRespond}
					callRejected={callRejected}
					isSmallScreen={isSmallScreen}
				/>
			) : null}
		</div>
	);
};

export default Call;
