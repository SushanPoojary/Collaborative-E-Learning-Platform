import { useState } from 'react';
import './CompilePage.css';
import Editor from "@monaco-editor/react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, LinearProgress } from '@mui/material';
import { Skeleton } from '@mui/material';
import Header from './Header';
import { backendURL } from '../utils/config';

function CompilePage() {
const [userCode, setUserCode] = useState(``);
const [userInput, setUserInput] = useState("");
const [userOutput, setUserOutput] = useState("");
const [loading, setLoading] = useState(false);
const navigate = useNavigate();


function compile() {
	setLoading(true);
	if (userCode === ``) {
	return
	}

	axios.post(`${backendURL}/code/run`, {
	code: userCode,
	language: "python",
    id: localStorage.getItem('username'),
	input: userInput 
    })
    .then((res) => {
    console.log(res.data)
	setUserOutput(res.data);
	})
    .then(() => {
	setLoading(false);
	})
}


function clearOutput() {
	setUserOutput("");
}

function returnCollab() {
	navigate(-1)
}

return (
	<div>
		<Header />
	<div className="CompilePage">
	<div className="main">
		<div className="left-container">
		<Editor
			height="calc(100vh - 50px)"
			width="100%"
			theme="vs-dark"
			language="python"
			defaultLanguage="python"
			defaultValue={localStorage.getItem('code')}
			onChange={(value) => { setUserCode(value) }}
		/>
		<button className="run-btn" onClick={() => compile()}>
			Run
		</button>
		</div>
		<div className="right-container">
		<h4>Input:</h4>
		<div className="input-box">
			<textarea id="code-inp" onChange=
			{(e) => setUserInput(e.target.value)}>
			</textarea>
		</div>
		<h4>Output:</h4>
		{loading ? (
			<div>
			<CircularProgress color = "warning"/>
            <h4>Loading...</h4>
			<LinearProgress color="primary"/>
			<Skeleton animation="pulse" sx={{ bgcolor: 'darkgrey' }} variant="rectangular" height={128} />
			</div>
		) : (
			<div className="output-box">
			<pre>{userOutput}</pre>
			<button onClick={() => { clearOutput() }}
				className="clear-btn">
				Clear
			</button>
            <button onClick={() => { returnCollab() }}
				className="return-btn">
				Return to collab
			</button>
			</div>
		)}
		</div>
	</div>
	</div>
	</div>
);
}

export default CompilePage;
