import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { Navigate, useNavigate } from 'react-router-dom';
import InstructorHome from './InstructorHome'

const Home = () => {
    const navigate = useNavigate();

    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');
    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        toast.success('New Room Created!');
    };

    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error('Please enter Room ID & Username.');
            return;
        }

        navigate(`/editor/${roomId}`, {
            state: {
                username,
            },
        });
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };
    return (
        (localStorage.getItem('type')==='Instructor')?
        (
        <InstructorHome />

    ):(localStorage.getItem('type')==='Student')?(
        <div className="homePageWrapper">
            <div className="formWrapper">
                <h4 className="mainLabel">ROOM ID</h4>
                <div className="inputGroup">
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="ROOM ID"
                        onChange={(e) => setRoomId(e.target.value)}
                        value={roomId}
                        onKeyUp={handleInputEnter}
                    />
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="USERNAME"
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                        onKeyUp={handleInputEnter}
                    />
                    <button className="btn joinBtn" onClick={joinRoom}>
                        Join
                    </button>
                </div>
            </div>
        </div>       
    ):(
       <Navigate replace to ='/signin' />
    )
    )
};

export default Home;
