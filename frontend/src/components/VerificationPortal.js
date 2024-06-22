import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VerificationPortal.css';

const VerificationPortal = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const [tasks, setTasks] = useState([]);

  const toggleMenu = () => {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('active');
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tasks');
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleFileClick = (fileNo) => {
    navigate(`/verform?fileNo=${fileNo}`);
  };

  return (
    <div className="page-container">
      <header>
        <h1>Hello {username}</h1>
        <nav>
          <div className="burger-menu" id="burger-menu" onClick={toggleMenu}>
            &#9776;
          </div>
          <ul id="nav-links">
            <li>
              <button onClick={() => navigate('/verform')}>Verification</button>
            </li>
            <li>
              <button onClick={() => navigate('/reverification')}>Re-Verification</button>
            </li>
            <li>
              <button onClick={() => navigate('/reports')}>Reports</button>
            </li>
            <li>
              <button onClick={() => navigate('/landing')}>Back Home</button>
            </li>
          </ul>
        </nav>
      </header>
      <div className="main-section">
        <div className="section-files">
          <div className="section-header"><u>Files For Verification</u></div>
          <div className="grid-container">
            <div className="grid-row">
              <div className="grid-cell"><b>File No</b></div>
              <div className="grid-cell"><b>File Type</b></div>
              <div className="grid-cell"><b>Priority</b></div>
              <div className="grid-cell"><b>Due Date</b></div>
            </div>
            <div className="grid-body">
              {tasks.slice(0, 5).map(task => (
                <div key={task.FAV_ATAFileNo} className="grid-row">
                  <div className="grid-cell">
                    <a href="#" onClick={() => handleFileClick(task.FAV_ATAFileNo)}>
                      {task.FAV_ATAFileNo}
                    </a>
                  </div>
                  <div className="grid-cell">{task.FAV_ATAFileType}</div>
                  <div className="grid-cell">{task.FAV_ATATaskPriority}</div>
                  <div className="grid-cell">{new Date(task.FAV_ATATaskDueDt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="section-work">
          <div className="section-header"><u>Work Summary</u></div>
        </div>
        <div className="section-pending">
          <div className="section-header"><u>Pending Tasks</u></div>
        </div>
        <div className="section-notes">
          <div className="section-header"><u>Sticky Notes</u></div>
        </div>
      </div>
      <footer>
        <p>&copy; 2024 Ardur Technology</p>
      </footer>
    </div>
  );
};

export default VerificationPortal;
