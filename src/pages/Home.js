import { useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sidebar } from '../components/sidebar';
import {
	getConversations,
	updateMessageSeen,
	updateMessagesAndConversations,
} from '../Slices/chatSlice';
import { TeleDailerHome } from '../components/chat/welcome';
import { ChatContainer } from '../components/chat';
import SocketContext from '../context/SocketContext';
import Call from '../components/chat/call/Call';
import Peer from 'simple-peer';
import { getConversationId, getConversationName, getConversationPicture } from '../utils/chat';
import toast, { Toaster } from 'react-hot-toast';

const callData = {
	ourSocketId: '',
	receiverSocketId: '',
	callEnded: false,
	gettingCall: false,
	callAccepted: false,
	name: '',
	picture: '',
	signal: '',
};

export default function Home() {
	const dispatch = useDispatch();
	const { user } = useSelector((state) => state.user);
	const { activeConversation, messages } = useSelector((state) => state.chat);
	const socket = useContext(SocketContext);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const [typing, setTyping] = useState(null);
	const [showSidebar, setShowSidebar] = useState(true); // Initially show the sidebar
	const [isSmallScreen, setIsSmallScreen] = useState(false);
	const [totalSecInCall, setTotalSecInCall] = useState(0);
	const [call, setCall] = useState(callData);
	const [togglePictureInPic, setTogglePictureInPic] = useState(false);
	const [stream, setStream] = useState();
	const [callKey, setCallKey] = useState(0);
	const { callAccepted } = call;

	//---------

	const [show, setShow] = useState(false);
	const myVideo = useRef();
	const userVideo = useRef();
	const connectionRef = useRef();

	//------------join user into the socket.io--------------

	//join user into the socket
	useEffect(() => {
		console.log("home done",user._id);
		socket.emit('join', user._id);
		//get online users
		socket.on('get-online-users', (users) => {
			setOnlineUsers(users);
		});

		// Add event listener for resize
		const handleResize = () => {
			setIsSmallScreen(window.matchMedia('(max-width: 768px)').matches);
		};
		window.addEventListener('resize', handleResize);
		// Initial check for screen size
		setIsSmallScreen(window.matchMedia('(max-width: 768px)').matches);
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, [socket, user]);

	// ------------------------Calling effect ------------------------

	useEffect(() => {
		if (stream) {
			// Add event listener to track
			myVideo.current.srcObject = stream;
			stream.getTracks().forEach((track) => {});
		}
	}, [stream]);

	useEffect(() => {
		setupMedia();
		socket.on('setup socket', (id) => {
			setCall((prev) => ({
				...prev,
				ourSocketId: id,
			}));
		});

		socket.on('incoming call', (data) => {
			console.log("📲 Incoming call event received!", data);
			if (callAccepted) return;
			setCall((prev) => ({
				...prev,
				name: data.name,
				picture: data.picture,
				signal: data.signal,
				receiverSocketId: data.from,
				gettingCall: true,
			}));
			// setShow(true);
		});

		socket.on('not responded', async () => {
			if (stream) {
				// Stop media devices
				const tracks = stream.getTracks();
				tracks.forEach((track) => track.stop());
			}

			setShow(false);
			setCall((prev) => ({
				...prev,
				callEnded: false,
				gettingCall: false,
				receiverSocketId: '',
				name: '',
				picture: '',
				signal: '',
			}));
			window.location.reload(true);
		});

		socket.on('call rejected', async () => {
			window.location.reload(true);
			if (connectionRef.current) {
				connectionRef.current.destroy();
			}

			if (stream) {
				// Stop media devices
				const tracks = stream.getTracks();
				tracks.forEach((track) => track.stop());
			}

			setShow(false);
			setCall({
				...call,
				callEnded: false,
				gettingCall: false,
				receiverSocketId: '',
				name: '',
				picture: '',
				callAccepted: false,
			});
			setCallKey((prevKey) => prevKey + 1);
		});

		socket.on('end call', ({ to }) => {
			setShow(false);

			setCall((prev) => ({
				...prev,
				callEnded: false,
				gettingCall: false,
				receiverSocketId: '',
				name: '',
				picture: '',
				signal: '',
				ourSocketId: to,
				callAccepted: false,
			}));

			if (stream) {
				// Stop media devices
				const tracks = stream.getTracks();
				tracks.forEach((track) => track.stop());
			}
			if (connectionRef.current) {
				// Close the peer connection
				connectionRef.current.destroy();

				// Optionally, set the reference to null or perform any cleanup
				connectionRef.current = null;
			}
			// connectionRef.current.destroy();
			setCallKey((prevKey) => prevKey + 1);
			window.location.reload(true);
		});

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const setupMedia = () => {
		navigator.mediaDevices
			.getUserMedia({ video: true, audio: true })
			.then((stream) => {
				setStream(stream);
			})
			.catch((error) => {});
	};

	// -------------------calling functions----------------------

	const callUser = async () => {
		try {
			console.log("callUser function triggered");
			myVideo.current.srcObject = stream;
			setShow(true);
			setCall((prev) => ({
				...prev,
				name: getConversationName(user, activeConversation.users),
				picture: getConversationPicture(user, activeConversation.users),
				callEnded: false,
			}));
	
			console.log("Initializing Peer connection...");
			const peer = new Peer({
				initiator: true,
				trickle: false,
				stream: stream,
			});
	
			peer.on("signal", (data) => {
				console.log("Sending call signal:", data);
				socket.emit("call user", {
					userToCall: getConversationId(user, activeConversation.users),
					signal: data,
					from: call.ourSocketId,
					name: user.name,
					picture: user.picture,
					callAccepted: true,
				});
			});
	
			peer.on("stream", (stream) => {
				console.log("Receiving stream...");
				userVideo.current.srcObject = stream;
			});
	
			socket.on("call accepted", ({ signal, receiverId }) => {
				console.log("Call accepted, signaling peer...");
				setCall((prev) => ({
					...prev,
					betweenACall: true,
					callAccepted: true,
					receiverSocketId: receiverId,
				}));
				peer.signal(signal);
			});
	
			connectionRef.current = peer;
		} catch (error) {
			console.error("Error in callUser:", error);
			toast.error("Error:", error);
		}
	};
	
	const answerCall = async () => {
		try {
			console.log("answerCall function triggered");
			console.log("2nd line");
	
			const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
				.catch(error => {
					console.error("🚨 Error getting user media:", error);
					throw error; // Rethrow error for global handling
				});
	
			console.log("✅ Got user media stream", stream);
	
			setStream(stream);
			setShow(true);
	
			if (myVideo?.current) {
				myVideo.current.srcObject = stream;
			}
	
			setCall((prev) => ({ ...prev, callAccepted: true }));
	
			console.log("Initializing Peer connection...");
			const peer = new Peer({
				initiator: false,
				trickle: false,
				stream: stream,
			});
	
			peer.on("signal", (data) => {
				console.log("📡 Answering call with signal:", data);
				socket.emit("answer call", {
					signal: data,
					from: call.ourSocketId,
					to: call.receiverSocketId,
				});
			});
	
			peer.on("stream", (stream) => {
				console.log("📲 Receiving peer stream...");
				if (userVideo?.current) {
					userVideo.current.srcObject = stream;
				}
			});
	
			console.log("📡 Signaling peer with received call signal:", call.signal);
			peer.signal(call.signal);
	
			connectionRef.current = peer;
		} catch (error) {
			console.error("🔥 Error in answerCall:", error);
			toast.error(`Error: ${error.message}`);
		}
	};
	
	// -----------------------------------
	const endCall = () => {
		console.log("Ending call...");
		setShow(false);
		setCall((prev) => ({
			...prev,
			callEnded: false,
			gettingCall: false,
			receiverSocketId: "",
			name: "",
			picture: "",
			signal: "",
			callAccepted: false,
		}));
	
		console.log("Emitting 'end call' event for receiverSocketId:", call.receiverSocketId);
		socket.emit("end call", call.receiverSocketId);
	
		if (connectionRef.current) {
			console.log("Destroying Peer connection...");
			connectionRef.current.destroy();
			connectionRef.current = null;
		}
	
		setCallKey((prevKey) => prevKey + 1);
		window.location.reload(true);
	};
	

	const callNotRespond = () => {
		socket.emit('not responded', { to: call.receiverSocketId });
		window.location.reload(true);
	};

	const callRejected = () => {
		setShow(false);
		setCall((prev) => ({ ...prev, gettingCall: false, signal: '' }));
		socket.emit('call rejected', { to: call.receiverSocketId });
		setCallKey((prevKey) => prevKey + 1);
		window.location.reload(true);
	};

	// Toggle audio track function
	const toggleAudioTrack = () => {
		if (stream) {
			const audioTracks = stream.getAudioTracks();
			console.log("Audio track enabled:", audioTracks);

			if (audioTracks.length > 0) {
				const audioTrack = audioTracks[0];
				audioTrack.enabled = !audioTrack.enabled;
			} else {
				console.log('No audio track found in the stream');
			}
		} else {
			console.log('No active stream available');
		}
	};

	// Toggle video track function
	const toggleVideoTrack = () => {
		if (stream) {
			const videoTracks = stream.getVideoTracks();
			if (videoTracks.length > 0) {
				const videoTrack = videoTracks[0];
				videoTrack.enabled = !videoTrack.enabled;
				console.log(`Video track ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
			} else {
				console.log('No Video track found in the stream');
			}
		} else {
			console.log('No active Video stream available');
		}
	};

	//--------------------------------------------------------
	console.log('rendered.....');
	useEffect(() => {
		//listening to reveived messages
		socket.on('receive message', (message) => {
			dispatch(updateMessagesAndConversations(message));
			console.log('receive an socket event');
			// Check if the received message is from another user
			if (activeConversation && activeConversation.latestMessage) {
				socket.emit('messages seen', {
					convo_id: activeConversation._id,
					chatUserId: getConversationId(user, activeConversation.users),
				});
			}
			socket.on('messages seen', ({ convo_id }) => {
				if (activeConversation && activeConversation._id === convo_id) {
					dispatch(updateMessageSeen());
				}
			});
		});

		// listening to typing
		socket.on('typing', (conversation) => {
			setTyping(conversation);
		});

		socket.on('stop typing', () => {
			setTyping(false);
		});

		return () => {
			// Clean up event listeners
			socket.off('receive message');
			socket.off('typing');
			socket.off('stop typing');
		};
	}, [activeConversation, activeConversation.latestMessage, dispatch, socket, messages, user]);

	useEffect(() => {
		// Check if the received message is from another user
		if (activeConversation && activeConversation.latestMessage) {
			socket.emit('messages seen', {
				convo_id: activeConversation._id,
				chatUserId: getConversationId(user, activeConversation.users),
			});
		}
		socket.on('messages seen', ({ convo_id }) => {
			if (activeConversation && activeConversation._id === convo_id) {
				dispatch(updateMessageSeen());
			}
		});
	}, [activeConversation, dispatch, socket, user]);
	//--------------get conversations-------------------------
	useEffect(() => {
		if (user?.token) {
			dispatch(getConversations(user.token));
		}
	}, [user, dispatch]);

	useEffect(() => {
		if (isSmallScreen) {
			setShowSidebar(!activeConversation?._id); // Show sidebar only if there's no active conversation
		} else {
			setShowSidebar(true); // Always show sidebar on larger screens
		}
	}, [activeConversation, isSmallScreen]);

	const handlePictureInPicture = (state) => {
		if (userVideo && userVideo.current) {
			if (state === false) {
				// Request Picture-in-Picture mode
				userVideo.current.requestPictureInPicture().catch((error) => {
					console.error('Error entering Picture-in-Picture mode:', error);
				});
			} else if (state === true) {
				// Exit Picture-in-Picture mode
				document.exitPictureInPicture().catch((error) => {
					console.error('Error exiting Picture-in-Picture mode:', error);
				});
			}
		}
	};
	const handleScreenShare = async () => {
		try {
			console.log("📡 handleScreenShare triggered, togglePictureInPic:", togglePictureInPic);
	
			if (togglePictureInPic) {
				console.log("🔄 Reverting to camera stream...");
				const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
	
				console.log("📷 Camera stream obtained:", userMediaStream);
				myVideo.current.srcObject = userMediaStream;
				setStream(userMediaStream);
				setTogglePictureInPic(false);
	
				const sender = connectionRef.current?.peerConnection
					?.getSenders()
					.find((s) => s.track?.kind === "video");
	
				if (sender && userMediaStream.getVideoTracks().length > 0) {
					console.log("🔄 Replacing video track with camera stream...");
					await sender.replaceTrack(userMediaStream.getVideoTracks()[0]);
				} else {
					console.warn("⚠️ No video sender found in peer connection!");
				}
	
				socket.emit("updateStream", { streamType: "camera" });
				console.log("📡 Socket event emitted: updateStream - camera");
			} else {
				console.log("🖥️ Starting screen sharing...");
				const screenStream = await navigator.mediaDevices.getDisplayMedia({
					video: { cursor: "always" },
					audio: false
				});
	
				console.log("📺 Screen stream obtained:", screenStream);
				myVideo.current.srcObject = screenStream;
				setStream(screenStream);
				setTogglePictureInPic(true);
	
				// const peerConnection = connectionRef.current?.peerConnection;
				// console.log("🔍 Checking connectionRef:", connectionRef);
				// console.log("🔍 Checking connectionRef.current:", connectionRef.current);
				const peerConnection = connectionRef.current?._pc;
console.log("📡 Checking peer connection:", peerConnection);
				
				if (!peerConnection) {
					console.error("❌ Peer connection is missing! Cannot replace track.");
					toast.error("Screen sharing failed: No active peer connection!");
					return;
				}
	
				const sender = peerConnection.getSenders().find((s) => s.track?.kind === "video");
	
				if (sender && screenStream.getVideoTracks().length > 0) {
					console.log("🔄 Before replaceTrack - sender.track:", sender.track);
					await sender.replaceTrack(screenStream.getVideoTracks()[0]);
					console.log("✅ After replaceTrack - sender.track:", sender.track);
				} else {
					console.warn("⚠️ No video sender found! Trying to add track manually...");
	
					try {
						const newSender = peerConnection.addTrack(screenStream.getVideoTracks()[0], screenStream);
						console.log("✅ New sender added:", newSender);
					} catch (error) {
						console.error("❌ Error adding new sender:", error);
						toast.error("Failed to add new track.");
					}
				}
	
				// Notify peer about stream change
				console.log("📡 Emitting updateStream event...");
				socket.emit("updateStream", { streamType: "screen" });
	
				// Handle when the user stops screen sharing
				screenStream.getVideoTracks()[0].onended = async () => {
					console.log("❌ Screen share ended, reverting to camera...");
					const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
	
					console.log("📷 Camera stream obtained after screen share ended:", userMediaStream);
					myVideo.current.srcObject = userMediaStream;
					setStream(userMediaStream);
					setTogglePictureInPic(false);
	
					const sender = connectionRef.current?.peerConnection
						?.getSenders()
						.find((s) => s.track?.kind === "video");
	
					if (sender && userMediaStream.getVideoTracks().length > 0) {
						await sender.replaceTrack(userMediaStream.getVideoTracks()[0]);
					}
	
					socket.emit("updateStream", { streamType: "camera" });
					console.log("📡 Socket event emitted: updateStream - camera");
				};
			}
		} catch (error) {
			console.error("❌ Error in handleScreenShare:", error);
			toast.error("Screen sharing failed!");
		}
	};
	
	useEffect(() => {
		document.addEventListener('visibilitychange', (event) => {
			if (document.visibilityState === 'visible') {
				if (document.pictureInPictureElement) {
					document.exitPictureInPicture();
				}
			}
		});
	});

	return (
		<>
			<div className='min-h-screen w-full  dark:bg-dark_bg_1  flex items-center justify-around overflow-hidden overflow-x-scroll scrollbar-hide'>
				{/* container */}
				{/* <div id='installApp'></div> */}
				<div className='container h-screen flex '>
					{/* sidebar */}
					{showSidebar && <Sidebar onlineUsers={onlineUsers} typing={typing} />}

					{activeConversation?._id && (
						<ChatContainer
							onlineUsers={onlineUsers}
							typing={typing}
							callUser={callUser}
						/>
					)}
					{!isSmallScreen && !activeConversation?._id && <TeleDailerHome />}
				</div>
			</div>
			<Toaster />
			<div className={show || call.gettingCall ? '' : 'hidden'}>
				<Call
					call={call}
					setCall={setCall}
					myVideo={myVideo}
					userVideo={userVideo}
					stream={stream}
					answerCall={answerCall}
					show={show}
					setShow={setShow}
					key={callKey}
					callNotRespond={callNotRespond}
					toggleAudioTrack={toggleAudioTrack}
					toggleVideoTrack={toggleVideoTrack}
					endCall={endCall}
					handleScreenShare={handleScreenShare}
					handlePictureInPicture={handlePictureInPicture}
					callRejected={callRejected}
					totalSecInCall={totalSecInCall}
					setTotalSecInCall={setTotalSecInCall}
					togglePictureInPic={togglePictureInPic}
					setTogglePictureInPic={setTogglePictureInPic}
					isSmallScreen={isSmallScreen}
				/>
			</div>
		</>
	);
}
