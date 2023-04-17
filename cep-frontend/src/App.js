import { Route, Routes } from 'react-router-dom';
import SignUp from './pages/SignUp';
import SignIn from './pages/SingIn';
import Home from './pages/Home';
import Editor from './pages/Editor';
import UserInput from './pages/session';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/home" element={<Home />} />
        <Route path="/:id" element={<Editor />} />
        <Route path="/session" element={<UserInput />} />
      </Routes>
    </div>
  );
}

export default App;
