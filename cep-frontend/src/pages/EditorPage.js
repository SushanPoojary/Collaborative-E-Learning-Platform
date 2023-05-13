import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Grid } from '@mui/material';
import PdfViewer from './PdfViewer';
import ACTIONS from '../utils/Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../utils/socket';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        console.log(`${username} joined`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                }
            );

            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );
        };
        init();
        return () => {
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
        };
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    function leaveRoom() {
        reactNavigator('/home');
    }

    function localCode() {
        localStorage.setItem('code', codeRef.current);
        reactNavigator('/editor/run');
    }

    function logout() {
        localStorage.clear();
        localStorage.removeItem('email');
        localStorage.removeItem('username');
        localStorage.removeItem('type');
        reactNavigator('/signin');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <Grid container spacing={0}>
        <Grid item xs={6}>
          <PdfViewer />
        </Grid>
        <Grid item xs={6}>
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn codeAln" onClick={localCode}>
                    Local Code
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave Room
                </button>
                <button className="btn logout" onClick={logout}>
                    Logout
                </button>
            </div>
            <div className="editorWrap">
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                    }}
                />
            </div>
        </div>
        </Grid>
      </Grid>
        
    );
};

export default EditorPage;
